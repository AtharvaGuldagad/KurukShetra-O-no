from database import SessionLocal, engine, Base
from models import Zone, ZoneState, Resource, AuditLog

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    #inital states and demo zones
    zones_data = [
        {
            "location": {"lat": 29.9716, "lng": -90.0715, "name": "Ward 7, Riverside"},
            "disaster_type": "flood",
            "severity_score": 88,
            "priority_tier": "Critical",
            "needs": [
                {"type": "medical_kits", "urgency": "critical"},
                {"type": "clean_water", "urgency": "high"}
            ],
            "source_confidence": 0.95,
            "source_refs": ["rep_101", "news_01"]
        },
        {
            "location": {"lat": 29.9510, "lng": -90.0821, "name": "Downtown Sector B"},
            "disaster_type": "flood",
            "severity_score": 64,
            "priority_tier": "High",
            "needs": [
                {"type": "food_rations", "urgency": "high"},
                {"type": "blankets", "urgency": "medium"}
            ],
            "source_confidence": 0.85,
            "source_refs": ["rep_102"]
        },
        {
            "location": {"lat": 29.9320, "lng": -90.0510, "name": "East Harbor District"},
            "disaster_type": "power_outage",
            "severity_score": 42,
            "priority_tier": "Medium",
            "needs": [
                {"type": "generators", "urgency": "medium"}
            ],
            "source_confidence": 0.90,
            "source_refs": ["rep_103"]
        },
        {
            "location": {"lat": 29.9850, "lng": -90.1100, "name": "West Ridge Suburb"},
            "disaster_type": "storm_damage",
            "severity_score": 20,
            "priority_tier": "Low",
            "needs": [
                {"type": "tarp_shelters", "urgency": "low"}
            ],
            "source_confidence": 0.75,
            "source_refs": ["rep_104"]
        }
    ]

    for data in zones_data:
        zone = Zone(
            location=data["location"],
            disaster_type=data["disaster_type"]
        )
        db.add(zone)
        db.flush()

        zone_state = ZoneState(
            zone_id=zone.id,
            severity_score=data["severity_score"],
            priority_tier=data["priority_tier"],
            needs=data["needs"],
            source_confidence=data["source_confidence"],
            source_refs=data["source_refs"],
            version=1
        )
        db.add(zone_state)

    # Disaster Relief Resources
    resources_data = [
        {"resource_type": "medical_kits", "quantity_available": 500, "depot_location": "Depot North", "owning_agency": "Red Cross"},
        {"resource_type": "clean_water", "quantity_available": 2000, "depot_location": "Depot North", "owning_agency": "FEMA"},
        {"resource_type": "food_rations", "quantity_available": 1500, "depot_location": "Depot South", "owning_agency": "World Central Kitchen"},
        {"resource_type": "generators", "quantity_available": 50, "depot_location": "Depot Central", "owning_agency": "National Guard"},
        {"resource_type": "tarp_shelters", "quantity_available": 300, "depot_location": "Depot South", "owning_agency": "Red Cross"},
    ]

    for res in resources_data:
        resource = Resource(**res)
        db.add(resource)

    # Audit Log
    db.add(AuditLog(
        event_type="system.initialized",
        actor="system",
        payload={"message": "Initial database seed completed successfully."}
    ))

    db.commit()
    db.close()
    print("Database successfully seeded.")

if __name__ == "__main__":
    seed_database()