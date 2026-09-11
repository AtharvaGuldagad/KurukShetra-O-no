import pulp
from typing import List, Dict

def solve_allocations(zones: List[Dict], inventory: List[Dict]) -> List[Dict]:
    """
    Deterministic solver matching zones' urgent needs to available inventory.
    Guarantees allocation quantities never exceed available stock.
    """
    prob = pulp.LpProblem("Resource_Allocation", pulp.LpMaximize)

    allocation_vars = {}
    for z in zones:
        for item in inventory:
            var_name = f"alloc_{z['zone_id']}_{item['resource_type']}"
            # Variable: quantity allocated to zone from this resource
            allocation_vars[(z['zone_id'], item['resource_type'])] = pulp.LpVariable(
                var_name, lowBound=0, upBound=item['quantity_available'], cat="Integer"
            )

    # Objective: Maximize severity-weighted resource distribution
    prob += pulp.lpSum([
        allocation_vars[(z['zone_id'], item['resource_type'])] * z['severity_score']
        for z in zones
        for item in inventory
    ])

    # Constraint: Total allocated cannot exceed inventory on hand
    for item in inventory:
        prob += pulp.lpSum([
            allocation_vars[(z['zone_id'], item['resource_type'])]
            for z in zones
        ]) <= item['quantity_available']

    prob.solve(pulp.PULP_CBC_CMD(msg=0))

    results = []
    for z in zones:
        for item in inventory:
            val = pulp.value(allocation_vars[(z['zone_id'], item['resource_type'])])
            if val and val > 0:
                # Guardrail: check if allocation takes > 50% of critical inventory
                requires_human = val > (item['quantity_available'] * 0.5)
                results.append({
                    "zone_id": z['zone_id'],
                    "resource_type": item['resource_type'],
                    "quantity": int(val),
                    "source_depot": item['depot_location'],
                    "assigned_agency": item['owning_agency'],
                    "reasoning": f"Weighted optimal match for severity {z['severity_score']}.",
                    "requires_human_approval": requires_human
                })
    return results