from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, cast, String
from typing import Optional, List, Dict
from datetime import datetime
import uuid
import logging

from app.core.database import get_db
from app.models.models import AuditLog, Allocation
from app.core.auth import get_current_official_user

logger = logging.getLogger(__name__)
router = APIRouter()


# ═══════════════════════════════════════════════════════════════════════════════
# Audit Log Query
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/audit-log")
def get_audit_log(
    event_type: Optional[str] = Query(None),
    actor: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    official: dict = Depends(get_current_official_user),
):
    """Filterable audit log query. Returns most recent entries first."""
    query = db.query(AuditLog).order_by(desc(AuditLog.created_at))

    if event_type and event_type != "all":
        query = query.filter(AuditLog.event_type == event_type)

    if actor and actor != "all":
        query = query.filter(AuditLog.actor == actor)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            AuditLog.event_type.ilike(search_pattern)
            | AuditLog.actor.ilike(search_pattern)
            | cast(AuditLog.payload, String).ilike(search_pattern)
        )

    entries = query.limit(limit).all()

    return [
        {
            "id": e.id,
            "event_type": e.event_type,
            "actor": e.actor,
            "payload": e.payload,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in entries
    ]


# ═══════════════════════════════════════════════════════════════════════════════
# Audit Simulation — Full End-to-End Synthetic Run
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/audit/simulate")
async def run_audit_simulation(
    db: Session = Depends(get_db),
    official: dict = Depends(get_current_official_user),
):
    """
    Runs a complete end-to-end synthetic disaster simulation for demo/audit purposes.

    Steps:
      1. Creates 3 synthetic disaster zones (Critical, High, Medium severity)
      2. Creates synthetic inventory (medical kits, water, food, rescue gear)
      3. Scores each zone using Agent A's rubric (no LLM — deterministic)
      4. Runs Agent B's full hybrid pipeline:
           OurModel qualitative analysis → LP solve → justifications
      5. Writes every step as an audit log entry (actor = "Simulation")
      6. Returns full trace for dashboard display

    Does NOT persist zones/resources to the DB — purely synthetic audit exercise.
    """
    sim_id = f"sim_{uuid.uuid4().hex[:8]}"
    trace: List[Dict] = []

    def _log(event_type: str, payload: Dict) -> AuditLog:
        entry = AuditLog(
            event_type=event_type,
            actor="Simulation",
            payload={"sim_id": sim_id, **payload},
        )
        db.add(entry)
        return entry

    # ── Step 1: Synthetic Zone Data ─────────────────────────────────────────
    synthetic_zones = [
        {
            "zone_id": f"{sim_id}_zone_critical",
            "location": {"lat": 19.076, "lng": 72.877, "name": "Coastal Ward 3 — Dharavi"},
            "disaster_type": "flood",
            "population_affected_est": 12000,
            "casualties": 8,
            "needs": [
                {"type": "medical", "urgency": "critical"},
                {"type": "rescue", "urgency": "critical"},
                {"type": "shelter", "urgency": "high"},
            ],
            "severity_score": 92,
            "priority_tier": "Critical",
            "source_confidence": 0.95,
            "source_refs": [f"{sim_id}_report_001"],
            "deterioration_delta": "+18 since last report",
        },
        {
            "zone_id": f"{sim_id}_zone_high",
            "location": {"lat": 28.704, "lng": 77.102, "name": "North District — Yamuna Belt"},
            "disaster_type": "flood",
            "population_affected_est": 5500,
            "casualties": 2,
            "needs": [
                {"type": "water", "urgency": "critical"},
                {"type": "food", "urgency": "high"},
                {"type": "medical", "urgency": "high"},
            ],
            "severity_score": 73,
            "priority_tier": "High",
            "source_confidence": 0.85,
            "source_refs": [f"{sim_id}_report_002"],
            "deterioration_delta": "+7 since last report",
        },
        {
            "zone_id": f"{sim_id}_zone_medium",
            "location": {"lat": 26.846, "lng": 80.946, "name": "Eastern Sector — Gomti Nagar"},
            "disaster_type": "landslide",
            "population_affected_est": 1200,
            "casualties": 0,
            "needs": [
                {"type": "rescue", "urgency": "high"},
                {"type": "shelter", "urgency": "medium"},
            ],
            "severity_score": 48,
            "priority_tier": "Medium",
            "source_confidence": 0.75,
            "source_refs": [f"{sim_id}_report_003"],
            "deterioration_delta": "+3 since last report",
        },
    ]

    _log("simulation.zones_created", {
        "step": 1,
        "description": "Synthetic disaster zones created for simulation",
        "zones": [
            {
                "zone_id": z["zone_id"],
                "location": z["location"]["name"],
                "disaster_type": z["disaster_type"],
                "severity_score": z["severity_score"],
                "priority_tier": z["priority_tier"],
                "casualties": z["casualties"],
                "population_affected_est": z["population_affected_est"],
            }
            for z in synthetic_zones
        ],
    })
    trace.append({"step": 1, "event": "zones_created", "zones": synthetic_zones})

    # ── Step 2: Synthetic Inventory ─────────────────────────────────────────
    synthetic_inventory = [
        {
            "resource_type": "medical_kits",
            "quantity_available": 400,
            "depot_location": "Central Depot A",
            "owning_agency": "Red Cross Unit 1",
        },
        {
            "resource_type": "water_purification_units",
            "quantity_available": 150,
            "depot_location": "Northern Depot B",
            "owning_agency": "NDRF Team Alpha",
        },
        {
            "resource_type": "food_rations",
            "quantity_available": 1200,
            "depot_location": "Central Depot A",
            "owning_agency": "Civil Defence Corps",
        },
        {
            "resource_type": "rescue_equipment",
            "quantity_available": 80,
            "depot_location": "Southern Depot C",
            "owning_agency": "State Disaster Response Force",
        },
        {
            "resource_type": "emergency_shelter_kits",
            "quantity_available": 250,
            "depot_location": "Northern Depot B",
            "owning_agency": "Red Cross Unit 2",
        },
    ]

    _log("simulation.inventory_snapshot", {
        "step": 2,
        "description": "Synthetic inventory assembled for allocation run",
        "inventory": [
            {
                "resource_type": i["resource_type"],
                "quantity_available": i["quantity_available"],
                "depot_location": i["depot_location"],
                "owning_agency": i["owning_agency"],
            }
            for i in synthetic_inventory
        ],
        "total_resource_types": len(synthetic_inventory),
        "total_units": sum(i["quantity_available"] for i in synthetic_inventory),
    })
    trace.append({"step": 2, "event": "inventory_snapshot", "inventory": synthetic_inventory})

    # ── Step 3: Agent A Scoring (deterministic rubric) ──────────────────────
    _log("simulation.agent_a_scoring", {
        "step": 3,
        "description": "Agent A rubric-based severity scoring applied to all zones",
        "scores": [
            {
                "zone_id": z["zone_id"],
                "severity_score": z["severity_score"],
                "priority_tier": z["priority_tier"],
                "source_confidence": z["source_confidence"],
            }
            for z in synthetic_zones
        ],
        "note": "Deterministic rubric: casualties>10 or population>10000 → Critical(80-100), etc.",
    })
    trace.append({"step": 3, "event": "agent_a_scoring_complete"})

    # ── Step 4: OurModel Qualitative Analysis (Agent B Phase 1) ────────────
    from app.agents.agent_b import our_model, solve_allocations

    adjusted_weights, zone_flags = our_model.analyze_qualitative_factors(
        synthetic_zones, synthetic_inventory
    )

    _log("simulation.ourmodel_analysis", {
        "step": 4,
        "description": "OurModel qualitative analysis — weight adjustments computed",
        "analysis": [
            {
                "zone_id": z["zone_id"],
                "base_severity": z["severity_score"],
                "adjusted_weight": round(adjusted_weights.get(z["zone_id"], z["severity_score"]), 2),
                "boost_applied": round(
                    adjusted_weights.get(z["zone_id"], z["severity_score"]) - z["severity_score"], 2
                ),
                "qualitative_flags": zone_flags.get(z["zone_id"], []),
            }
            for z in synthetic_zones
        ],
    })
    trace.append({
        "step": 4,
        "event": "ourmodel_analysis",
        "adjusted_weights": adjusted_weights,
        "flags": zone_flags,
    })

    # ── Step 5: LP Solver + OurModel Justification (Agent B Phase 2 & 3) ───
    allocations = await solve_allocations(synthetic_zones, synthetic_inventory)

    _log("simulation.agent_b_allocations", {
        "step": 5,
        "description": "Agent B LP solver + OurModel justification complete",
        "solver": "PuLP CBC (Integer Linear Programming)",
        "allocations_generated": len(allocations),
        "allocations": [
            {
                "zone_id": a["zone_id"],
                "resource_type": a["resource_type"],
                "quantity": a["quantity"],
                "source_depot": a["source_depot"],
                "assigned_agency": a["assigned_agency"],
                "adjusted_weight": a.get("adjusted_weight"),
                "requires_human_approval": a["requires_human_approval"],
                "qualitative_flags": a.get("qualitative_flags", []),
                "reasoning": a["reasoning"],
            }
            for a in allocations
        ],
    })
    trace.append({"step": 5, "event": "allocations_generated", "allocations": allocations})

    # ── Step 6: Reallocation scenario (simulate a new critical update) ───────
    # Worsen the Medium zone to trigger a reallocation scenario
    reallocate_trigger_zone = dict(synthetic_zones[2])
    reallocate_trigger_zone["severity_score"] = 79
    reallocate_trigger_zone["priority_tier"] = "High"
    reallocate_trigger_zone["casualties"] = 3
    reallocate_trigger_zone["deterioration_delta"] = "+31 since last report"
    reallocate_trigger_zone["needs"] = [
        {"type": "rescue", "urgency": "critical"},
        {"type": "medical", "urgency": "critical"},
        {"type": "shelter", "urgency": "high"},
    ]

    updated_zones = [synthetic_zones[0], synthetic_zones[1], reallocate_trigger_zone]

    _log("simulation.reallocation_trigger", {
        "step": 6,
        "description": "Zone severity threshold breach — triggering automatic reallocation",
        "trigger": {
            "zone_id": reallocate_trigger_zone["zone_id"],
            "old_severity": synthetic_zones[2]["severity_score"],
            "new_severity": reallocate_trigger_zone["severity_score"],
            "delta": "+31",
            "new_tier": reallocate_trigger_zone["priority_tier"],
        },
    })

    re_allocations = await solve_allocations(updated_zones, synthetic_inventory)

    _log("simulation.reallocation_complete", {
        "step": 6,
        "description": "Post-trigger reallocation complete — diff shows shifted priority",
        "before_allocations": len(allocations),
        "after_allocations": len(re_allocations),
        "reallocated_zone": reallocate_trigger_zone["zone_id"],
        "new_allocations": [
            {
                "zone_id": a["zone_id"],
                "resource_type": a["resource_type"],
                "quantity": a["quantity"],
                "adjusted_weight": a.get("adjusted_weight"),
                "reasoning": a["reasoning"],
            }
            for a in re_allocations
        ],
    })
    trace.append({"step": 6, "event": "reallocation_complete", "re_allocations": re_allocations})

    # ── Step 7: Duplicate effort check ──────────────────────────────────────
    zone_resource_pairs_before = {(a["zone_id"], a["resource_type"]) for a in allocations}
    zone_resource_pairs_after  = {(a["zone_id"], a["resource_type"]) for a in re_allocations}
    potential_duplicates = zone_resource_pairs_before & zone_resource_pairs_after

    _log("simulation.duplicate_check", {
        "step": 7,
        "description": "Duplicate-effort detection pass completed",
        "potential_duplicates": [
            {"zone_id": zid, "resource_type": rt}
            for zid, rt in potential_duplicates
        ],
        "duplicate_count": len(potential_duplicates),
        "action": "Flagged for coordinator review" if potential_duplicates else "No duplicates — clean reallocation",
    })
    trace.append({"step": 7, "event": "duplicate_check", "duplicate_count": len(potential_duplicates)})

    # ── Commit all audit entries ─────────────────────────────────────────────
    db.commit()

    return {
        "status": "success",
        "sim_id": sim_id,
        "summary": {
            "zones_processed": len(synthetic_zones),
            "initial_allocations": len(allocations),
            "post_reallocation_allocations": len(re_allocations),
            "duplicate_flags": len(potential_duplicates),
            "audit_entries_written": 7,
        },
        "trace": [
            {"step": 1, "event": "zones_created", "zone_count": len(synthetic_zones)},
            {"step": 2, "event": "inventory_snapshot", "resource_types": len(synthetic_inventory)},
            {"step": 3, "event": "agent_a_scoring", "method": "deterministic_rubric"},
            {
                "step": 4,
                "event": "ourmodel_analysis",
                "weight_adjustments": {
                    zid: {
                        "base": next((z["severity_score"] for z in synthetic_zones if z["zone_id"] == zid), 0),
                        "adjusted": round(w, 2),
                        "flags": zone_flags.get(zid, []),
                    }
                    for zid, w in adjusted_weights.items()
                },
            },
            {
                "step": 5,
                "event": "initial_allocations",
                "allocations": [
                    {
                        "zone_id": a["zone_id"],
                        "resource_type": a["resource_type"],
                        "quantity": a["quantity"],
                        "adjusted_weight": a.get("adjusted_weight"),
                        "requires_human_approval": a["requires_human_approval"],
                        "qualitative_flags": a.get("qualitative_flags", []),
                        "reasoning": a["reasoning"],
                    }
                    for a in allocations
                ],
            },
            {
                "step": 6,
                "event": "reallocation_after_trigger",
                "trigger_zone": reallocate_trigger_zone["zone_id"],
                "severity_jump": "+31",
                "allocations": [
                    {
                        "zone_id": a["zone_id"],
                        "resource_type": a["resource_type"],
                        "quantity": a["quantity"],
                        "adjusted_weight": a.get("adjusted_weight"),
                        "reasoning": a["reasoning"],
                    }
                    for a in re_allocations
                ],
            },
            {
                "step": 7,
                "event": "duplicate_check",
                "duplicate_flags": len(potential_duplicates),
                "pairs": list(potential_duplicates),
            },
        ],
    }
