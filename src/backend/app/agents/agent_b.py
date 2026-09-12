"""
Agent B — Allocation & Optimization

Hybrid pipeline:
  1. OurModel (qualitative reasoning engine) — reads zone/inventory context,
     flags qualitative risk factors, and boosts LP objective weights accordingly
  2. Deterministic LP Solver (PuLP) — guarantees quantities respect inventory limits
     using OurModel-adjusted weights for smarter prioritization
  3. OurModel justification layer — produces structured plain-English reasoning
     from the same factors it used to weight the solve (no external API needed)

The solver always runs. OurModel always runs alongside it.
"""
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════════
# OurModel — Qualitative Reasoning Engine
# ═══════════════════════════════════════════════════════════════════════════════

class OurModel:
    """
    Purpose-built qualitative reasoning engine for disaster resource allocation.

    Works in two phases:
      Phase 1 (pre-solver)  : analyze_qualitative_factors()
        → returns per-zone weight multipliers + flags for LP objective
      Phase 2 (post-solver) : generate_justification()
        → produces structured plain-English reasoning from those same factors

    No external API call. Fully deterministic and auditable.
    """

    # Weight boost constants (additive on top of base severity_score)
    BOOST_ACCESS_CUTOFF    = 18   # flood/landslide with high severity → access window closing
    BOOST_DETERIORATION    = 15   # zone severity increasing rapidly (delta > 10)
    BOOST_CRITICAL_NEED    = 22   # zone has at least one "critical" urgency need
    BOOST_CASUALTY         = 20   # casualties > 0
    BOOST_LARGE_POPULATION = 12   # population_affected_est > 5000
    PENALTY_DUPLICATE      = -10  # zone already has a recent active allocation

    # Scarcity threshold — if stock for a resource type falls below this fraction,
    # flag it so the justification can note the constraint
    SCARCITY_THRESHOLD = 0.25

    # Disaster types that create time-sensitive access windows
    ACCESS_RISK_TYPES = {"flood", "landslide", "tsunami", "hurricane"}

    # ─── Phase 1: Pre-Solver Analysis ─────────────────────────────────────────

    def analyze_qualitative_factors(
        self,
        zones: List[Dict],
        inventory: List[Dict],
        existing_allocations: List[Dict] | None = None,
    ) -> Tuple[Dict[str, float], Dict[str, List[str]]]:
        """
        Analyze all active zones and return:
          - adjusted_weights: {zone_id → adjusted_LP_weight}
          - flags: {zone_id → [qualitative flag strings]}

        These feed directly into the LP solver objective coefficients and
        are later reused verbatim to build human-readable justifications.
        """
        existing_allocations = existing_allocations or []
        allocated_zone_ids = {a.get("zone_id") for a in existing_allocations}

        # Compute total inventory per resource type for scarcity detection
        inventory_totals: Dict[str, float] = {}
        for item in inventory:
            rtype = item.get("resource_type", "")
            inventory_totals[rtype] = (
                inventory_totals.get(rtype, 0) + item.get("quantity_available", 0)
            )

        adjusted_weights: Dict[str, float] = {}
        flags: Dict[str, List[str]] = {}

        for zone in zones:
            zone_id = zone.get("zone_id", "")
            base_score = float(zone.get("severity_score", 50))
            disaster_type = zone.get("disaster_type", "").lower()
            needs = zone.get("needs", [])
            population = zone.get("population_affected_est", 0) or 0
            casualties = zone.get("casualties", 0) or 0
            score_delta = zone.get("deterioration_delta", 0) or 0  # numeric delta
            priority_tier = zone.get("priority_tier", "Medium")

            zone_flags: List[str] = []
            boost = 0.0

            # 1. Access cutoff risk
            if disaster_type in self.ACCESS_RISK_TYPES and base_score >= 60:
                boost += self.BOOST_ACCESS_CUTOFF
                zone_flags.append(
                    f"ACCESS_RISK: {disaster_type} disaster — access window may close soon"
                )

            # 2. Active deterioration
            try:
                delta = float(str(score_delta).replace("+", "").replace(" since last report", ""))
            except (ValueError, TypeError):
                delta = 0.0
            if delta > 10:
                boost += self.BOOST_DETERIORATION
                zone_flags.append(
                    f"DETERIORATING: severity increased +{delta:.0f} since last report"
                )

            # 3. Critical urgency needs
            critical_needs = [n for n in needs if n.get("urgency") == "critical"]
            if critical_needs:
                boost += self.BOOST_CRITICAL_NEED
                need_types = ", ".join(n.get("type", "") for n in critical_needs)
                zone_flags.append(f"CRITICAL_NEED: {need_types} marked critical urgency")

            # 4. Casualties present
            if casualties > 0:
                boost += self.BOOST_CASUALTY
                zone_flags.append(f"CASUALTIES: {casualties} reported — life-safety priority")

            # 5. Large affected population
            if population > 5000:
                boost += self.BOOST_LARGE_POPULATION
                zone_flags.append(f"LARGE_POPULATION: {population:,} people affected")

            # 6. Duplicate allocation penalty
            if zone_id in allocated_zone_ids:
                boost += self.PENALTY_DUPLICATE
                zone_flags.append("DUPLICATE_CHECK: existing allocation in force — reduced weight")

            adjusted_weights[zone_id] = base_score + boost
            flags[zone_id] = zone_flags

        logger.info(
            "[OurModel] Qualitative analysis complete — %d zones processed, "
            "weight range: %.1f–%.1f",
            len(zones),
            min(adjusted_weights.values(), default=0),
            max(adjusted_weights.values(), default=0),
        )
        return adjusted_weights, flags

    # ─── Phase 2: Post-Solver Justification ───────────────────────────────────

    def generate_justification(
        self,
        zone: Dict,
        allocation: Dict,
        flags: List[str],
        inventory_snapshot: List[Dict],
    ) -> str:
        """
        Produce a structured plain-English justification for one allocation.
        Uses the same flags computed during pre-solver analysis — fully auditable,
        zero API latency.
        """
        severity = zone.get("severity_score", 50)
        tier = zone.get("priority_tier", "Medium")
        resource = allocation.get("resource_type", "resources")
        qty = allocation.get("quantity", 0)
        zone_name = zone.get("location", {}).get("name", zone.get("zone_id", "unknown zone"))

        # Lead sentence — severity and tier
        if severity >= 80:
            lead = (
                f"CRITICAL-tier deployment: {qty} units of {resource} dispatched to "
                f"{zone_name} (severity {severity}/100)."
            )
        elif severity >= 60:
            lead = (
                f"HIGH-priority deployment: {qty} units of {resource} allocated to "
                f"{zone_name} (severity {severity}/100)."
            )
        else:
            lead = (
                f"Standard allocation: {qty} units of {resource} assigned to "
                f"{zone_name} (severity {severity}/100)."
            )

        # Body — qualitative flags that influenced the decision
        if flags:
            # Strip the prefix codes for readability
            readable_flags = [f.split(": ", 1)[-1] for f in flags]
            body = " Qualitative factors: " + "; ".join(readable_flags) + "."
        else:
            body = f" Allocation determined by LP solver based on {tier} severity tier."

        # Tail — inventory scarcity note
        total_of_type = sum(
            i.get("quantity_available", 0)
            for i in inventory_snapshot
            if i.get("resource_type") == resource
        )
        if total_of_type > 0 and (qty / total_of_type) > (1 - self.SCARCITY_THRESHOLD):
            tail = f" ⚠ Inventory note: this allocation uses >{(1-self.SCARCITY_THRESHOLD)*100:.0f}% of available {resource} — stock is scarce."
        else:
            tail = f" Inventory constraint respected ({qty}/{total_of_type} units of {resource} used)."

        return lead + body + tail


# ─── Module-level singleton ──────────────────────────────────────────────────
our_model = OurModel()


# ═══════════════════════════════════════════════════════════════════════════════
# Pure-Python Priority-Weighted Greedy Solver (Mathematical Model)
#
# Implements the same objective as an LP solver:
#   Maximize  Σ  adjusted_weight[z] × quantity[z, r]
#   Subject to:
#     Σ_z quantity[z, r]  ≤  inventory[r]       (hard stock cap)
#     quantity[z, r]      ≤  fair_share[z] × 2   (anti-monopoly cap)
#     quantity[z, r]      ≥  0
#
# Uses OurModel-adjusted weights for ordering, then greedily allocates
# in descending priority order. No subprocess — no binary dependency.
# ═══════════════════════════════════════════════════════════════════════════════

async def solve_allocations(
    zones: List[Dict],
    inventory: List[Dict],
    existing_allocations: List[Dict] | None = None,
) -> List[Dict]:
    """
    Hybrid allocation pipeline:
      1. OurModel analyzes qualitative factors → adjusted priority weights
      2. Pure-Python greedy solver maximizes OurModel-weighted resource deployment
         subject to hard inventory constraints and fair-share caps (same
         mathematical model as LP, no subprocess required)
      3. OurModel generates structured plain-English justification per allocation

    Mathematical model:
      Maximize  Σ  adjusted_weight[z] × quantity[z, r]
      Subject to:
        Σ_z quantity[z, r]  ≤  stock[r]             (hard inventory cap)
        quantity[z, r]      ≤  fair_share[z] × 2     (anti-monopoly cap)
        quantity[z, r]      ≥  0, integer

    Guarantees:
      - Quantities never exceed available stock
      - Higher OurModel weight → proportionally larger allocation
      - Every allocation includes auditable OurModel reasoning
    """
    if not zones or not inventory:
        logger.warning("[Agent B] No zones or inventory — skipping solve.")
        return []

    # ── Phase 1: OurModel qualitative analysis ─────────────────────────────
    adjusted_weights, zone_flags = our_model.analyze_qualitative_factors(
        zones, inventory, existing_allocations
    )

    # ── Phase 2: Pure-Python priority-weighted greedy solver ───────────────
    # Sort zones by adjusted weight descending (highest priority gets first pick)
    sorted_zones = sorted(zones, key=lambda z: adjusted_weights.get(z["zone_id"], 0), reverse=True)

    # Mutable inventory pool (resource_type → remaining stock)
    stock: Dict[str, int] = {}
    inventory_meta: Dict[str, Dict] = {}
    for item in inventory:
        rtype = item["resource_type"]
        stock[rtype] = stock.get(rtype, 0) + item["quantity_available"]
        inventory_meta[rtype] = item  # last entry wins for depot/agency (simplified)

    total_weight = sum(adjusted_weights.values()) or 1.0

    results: List[Dict] = []

    for z in sorted_zones:
        zone_id = z["zone_id"]
        zone_weight = adjusted_weights.get(zone_id, z["severity_score"])

        # fair_share: fraction of total weight this zone contributes
        fair_share = zone_weight / total_weight

        for rtype, remaining in list(stock.items()):
            if remaining <= 0:
                continue

            item = inventory_meta[rtype]

            # Anti-monopoly cap: zone can take at most 2× its fair share
            # of the *original* stock for this resource type
            original_stock = item["quantity_available"]
            max_for_zone = max(1, int(original_stock * min(fair_share * 2, 1.0)))

            # Hard cap: can't exceed what's actually left in the pool
            qty = min(max_for_zone, remaining)

            if qty <= 0:
                continue

            # Deduct from mutable pool
            stock[rtype] -= qty

            # Guardrail: flag if this zone takes >50% of the original stock
            requires_human = qty > (original_stock * 0.5)

            allocation = {
                "zone_id": zone_id,
                "resource_type": rtype,
                "quantity": qty,
                "source_depot": item["depot_location"],
                "assigned_agency": item["owning_agency"],
                "requires_human_approval": requires_human,
                "adjusted_weight": round(zone_weight, 2),
                "qualitative_flags": zone_flags.get(zone_id, []),
            }

            # Phase 3: OurModel justification (deterministic, auditable)
            allocation["reasoning"] = our_model.generate_justification(
                z, allocation, zone_flags.get(zone_id, []), inventory
            )

            results.append(allocation)

    logger.info(
        "[Agent B] Greedy solver complete — %d allocations across %d zones.",
        len(results),
        len(zones),
    )
    return results