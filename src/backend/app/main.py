import asyncio
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.core.event_bus import event_bus
from app.api.endpoints import auth, reports, zones, inventory, allocations, agency_tasks, audit

# Initialize database tables
Base.metadata.create_all(bind=engine)


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"🔌 WebSocket connected. Active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"🔌 WebSocket disconnected. Active: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.active_connections.remove(connection)


manager = ConnectionManager()


async def redis_listener():
    """Listens to Redis events and pushes them to WebSocket clients."""
    try:
        pubsub = await event_bus.get_subscriber(
            "zone.updated", "allocation.recalculated",
            "agency.status_changed", "inventory.changed"
        )
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                await manager.broadcast({
                    "channel": message["channel"],
                    "data": data
                })
    except Exception as e:
        print(f"⚠️  Redis listener error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect Redis and start background listener
    try:
        await event_bus.connect()
        listener_task = asyncio.create_task(redis_listener())
        print("✅ Redis event bus connected")
    except Exception as e:
        print(f"⚠️  Redis unavailable ({e}). WebSocket events will be limited.")
        listener_task = None
    yield
    # Shutdown
    if listener_task:
        listener_task.cancel()


app = FastAPI(
    title="SOLACE Disaster Relief Coordinator",
    description="Agentic Disaster Relief & Emergency Resource Coordination API",
    version="1.2.0",
    lifespan=lifespan,
)

# Allow React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all API routers
app.include_router(auth.router, tags=["Auth"])
app.include_router(reports.router, tags=["Reports"])
app.include_router(zones.router, tags=["Zones"])
app.include_router(inventory.router, tags=["Inventory"])
app.include_router(allocations.router, tags=["Allocations"])
app.include_router(agency_tasks.router, tags=["Agency Tasks"])
app.include_router(audit.router, tags=["Audit Log"])


@app.get("/", response_class=JSONResponse)
def landing_page():
    return {
        "status": "operational",
        "service": "SOLACE Disaster Relief Coordinator",
        "version": "1.2.0",
        "docs": "/docs"
    }


@app.get("/api/health")
def api_health():
    """Machine-readable deep health: DB + Redis + table counts."""
    db_status, redis_status = "unknown", "unknown"
    counts: dict = {}
    # Postgres check
    try:
        from sqlalchemy import text as sa_text
        from app.core.database import SessionLocal
        db = SessionLocal()
        try:
            db.execute(sa_text("SELECT 1"))
            db_status = "up"
            for table in ("zones", "resources", "allocations", "agency_tasks", "audit_log"):
                try:
                    n = db.execute(sa_text(f"SELECT COUNT(*) FROM {table}")).scalar()
                    counts[table] = int(n or 0)
                except Exception:
                    counts[table] = None
        finally:
            db.close()
    except Exception as e:
        db_status = f"down: {e}"
    # Redis check
    try:
        import socket as _socket
        s = _socket.create_connection(("localhost", 6379), timeout=1.5)
        s.close()
        redis_status = "up"
    except Exception as e:
        redis_status = f"down: {e}"
    return {
        "status": "operational" if db_status == "up" else "degraded",
        "service": "SOLACE Disaster Relief Coordinator",
        "version": "1.2.0",
        "postgres": db_status,
        "redis": redis_status,
        "counts": counts,
    }


@app.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, receive any client messages
            data = await websocket.receive_text()
            # Echo acknowledgment
            await websocket.send_json({"type": "ack", "data": data})
    except WebSocketDisconnect:
        manager.disconnect(websocket)