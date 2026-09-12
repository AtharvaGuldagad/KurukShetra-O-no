"""
Seed script — populates the database with realistic disaster relief data
matching the frontend's expected data shape.
"""
from app.core.database import SessionLocal, Base, engine
from app.models.models import Zone, ZoneState, Resource, Allocation, AgencyTask, AuditLog


def seed():
    print("1. Clearing old database tables...")
    Base.metadata.drop_all(bind=engine)

    print("2. Creating all tables fresh...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("3. Seeding zones...")

        # ── Zones ─────────────────────────────────────────────────────────────
        zones_data = [
            ("zone_042", {"lat": 11.5540, "lng": 76.1265, "name": "Wayanad Sector 4, Meppadi (Kerala)"}, "landslide"),
            ("zone_044", {"lat": 26.1820, "lng": 91.7500, "name": "Guwahati Brahmaputra Bank (Assam)"}, "flood"),
            ("zone_043", {"lat": 19.8135, "lng": 85.8312, "name": "Puri Coastal Sector (Odisha)"}, "hurricane"),
            ("zone_045", {"lat": 30.5574, "lng": 79.5658, "name": "Joshimath Slope, Chamoli (Uttarakhand)"}, "landslide"),
            ("zone_046", {"lat": 9.9312, "lng": 76.2673, "name": "Kochi Backwaters, Ernakulam (Kerala)"}, "flood"),
            ("zone_047", {"lat": 19.0650, "lng": 72.8720, "name": "Mumbai Mithi River Basin (Maharashtra)"}, "flood"),
        ]

        for zid, loc, dtype in zones_data:
            db.add(Zone(id=zid, location=loc, disaster_type=dtype))
        db.commit()

        # ── Zone States ───────────────────────────────────────────────────────
        states_data = [
            ("zone_042", 92, "Critical", [{"type": "rescue", "urgency": "critical"}, {"type": "medical", "urgency": "critical"}, {"type": "shelter", "urgency": "high"}], 0.94, ["IMD_radar_kerala", "NDRF_battalion_dispatch_04"], 450, 12, 12.5),
            ("zone_044", 88, "Critical", [{"type": "food", "urgency": "critical"}, {"type": "water", "urgency": "critical"}, {"type": "rescue", "urgency": "high"}], 0.91, ["CWC_water_gauge_brahmaputra", "Assam_SDMA_bulletin"], 12000, 3, 5.2),
            ("zone_043", 68, "High", [{"type": "shelter", "urgency": "high"}, {"type": "food", "urgency": "medium"}], 0.89, ["Odisha_OSDMA_cyclone_alert"], 3200, 0, 2.1),
            ("zone_045", 72, "High", [{"type": "shelter", "urgency": "high"}, {"type": "medical", "urgency": "medium"}], 0.85, ["GSI_subsidence_sensor_grid"], 150, 0, 8.4),
            ("zone_046", 44, "Medium", [{"type": "water", "urgency": "medium"}, {"type": "medical", "urgency": "low"}], 0.82, ["Kochi_municipal_sluice_report"], 400, 0, 0.5),
            ("zone_047", 34, "Low", [{"type": "shelter", "urgency": "low"}], 0.78, ["BMC_disaster_cell_mumbai"], 800, 0, -1.2),
        ]

        for zid, score, tier, needs, conf, refs, pop, cas, det in states_data:
            db.add(ZoneState(
                zone_id=zid,
                severity_score=score,
                priority_tier=tier,
                needs=needs,
                source_confidence=conf,
                source_refs=refs,
                population_affected_est=pop,
                casualties=cas,
                deterioration_delta=det,
                version=1,
            ))
        db.commit()

        # ── Resources (Inventory) ─────────────────────────────────────────────
        print("4. Seeding inventory...")
        resources_data = [
            ("res_01", "Trauma Surgical Kits", 650, "Nagpur Central Depot", "Indian Red Cross Society"),
            ("res_02", "Inflatable Rescue Boats (Gemini)", 42, "Arakkonam NDRF Base", "NDRF 4th Battalion"),
            ("res_03", "High-Capacity Water Purifiers", 95, "Pune Western Depot", "SDRF Disaster Strike Force"),
            ("res_04", "Emergency Food Packets", 18000, "Kolkata Eastern Depot", "Aapda Mitra Relief Corps"),
            ("res_05", "Heavy Debris Cutters & Extrication Kits", 28, "Arakkonam NDRF Base", "NDRF 4th Battalion"),
        ]

        for rid, rtype, qty, depot, agency in resources_data:
            db.add(Resource(id=rid, resource_type=rtype, quantity_available=qty, depot_location=depot, owning_agency=agency))
        db.commit()

        # ── Allocations ───────────────────────────────────────────────────────
        print("5. Seeding allocations...")
        allocations_data = [
            ("alloc_001", "zone_042", "Heavy Debris Cutters & Extrication Kits", 14, "Arakkonam NDRF Base", "NDRF 4th Battalion",
             "Critical landslide search & rescue in Meppadi hill slope. High trapped civilian count.", False),
            ("alloc_002", "zone_044", "Inflatable Rescue Boats (Gemini)", 24, "Kolkata Eastern Depot", "SDRF Disaster Strike Force",
             "Brahmaputra embankment breach in Guwahati. Island settlement evacuation underway.", False),
            ("alloc_003", "zone_042", "Trauma Surgical Kits", 200, "Nagpur Central Depot", "Indian Red Cross Society",
             "Urgent surgical care for landslide crush victims at Meppadi triage point.", True),
        ]

        for aid, zid, rtype, qty, depot, agency, reason, human in allocations_data:
            db.add(Allocation(
                id=aid, zone_id=zid, resource_type=rtype, quantity=qty,
                source_depot=depot, assigned_agency=agency, reasoning=reason,
                requires_human_approval=human, status="Proposed",
            ))
        db.commit()

        # ── Agency Tasks ──────────────────────────────────────────────────────
        print("6. Seeding agency tasks...")
        tasks_data = [
            ("task_001", "alloc_001", "agency_ndrf_4", "In-Progress"),
            ("task_002", "alloc_002", "agency_sdrf", "In-Progress"),
            ("task_003", "alloc_003", "agency_ircs", "Pending"),
        ]

        for tid, aid, agid, status in tasks_data:
            db.add(AgencyTask(id=tid, allocation_id=aid, agency_id=agid, status=status))
        db.commit()

        # ── Audit Log ─────────────────────────────────────────────────────────
        print("7. Seeding audit log...")
        audit_data = [
            ("zone.updated", "Agent A", {"zone_id": "zone_042", "severity_score": 92, "priority_tier": "Critical", "summary": "Zone Wayanad Sector 4 severity escalated to Critical (92) — landslide casualties confirmed at 12."}),
            ("allocation.recalculated", "Agent B", {"allocation_id": "alloc_001", "summary": "14 extrication kits deployed to Wayanad (NDRF 4th Battalion) from Arakkonam Base."}),
            ("duplicate.flagged", "Agent A (Detection)", {"zone_id": "zone_042", "conflict": ["NDRF 4th Battalion", "SDRF Disaster Strike Force"], "need_type": "rescue extrication", "summary": "Flagged overlap: NDRF 4th Battalion and SDRF Strike Force both mobilized for Sector 4 search grid."}),
            ("report.submitted", "Field Reporter", {"zone_id": "zone_044", "summary": "Severe flooding reported at Brahmaputra Bank, Guwahati. Multiple settlements submerged."}),
            ("agency.status_changed", "NDRF 4th Battalion", {"task_id": "task_001", "old_status": "Pending", "new_status": "In-Progress", "summary": "NDRF 4th Battalion has commenced search and rescue operations in Wayanad Sector 4."}),
        ]

        for etype, actor, payload in audit_data:
            db.add(AuditLog(event_type=etype, actor=actor, payload=payload))
        db.commit()

        print("✅ Database seeded successfully with 6 zones, 5 resources, 3 allocations, 3 tasks, 5 audit entries.")
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()