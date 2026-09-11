from app.core.database import SessionLocal
from app.models.models import Zone, ZoneState, Resource

def seed():
    db = SessionLocal()
    # Add Depot Resources
    r1 = Resource(id="res_01", resource_type="medical_kits", quantity_available=250, depot_location="Central Depot", owning_agency="Red Cross")
    r2 = Resource(id="res_02", resource_type="drinking_water", quantity_available=1000, depot_location="North Depot", owning_agency="FEMA")
    db.add_all([r1, r2])

    # Add Initial Zone
    z1 = Zone(id="zone_01", location={"lat": 18.5204, "lng": 73.8567, "name": "Riverside Ward 4"}, disaster_type="Flood")
    db.add(z1)
    db.commit()

    zs1 = ZoneState(zone_id="zone_01", severity_score=75, priority_tier="High", needs=[{"type": "medical_kits", "urgency": "high"}])
    db.add(zs1)
    db.commit()
    db.close()
    print("Database seeded successfully.")

if __name__ == "__main__":
    seed()