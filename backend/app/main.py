import asyncio
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.core.event_bus import event_bus
from app.api.endpoints import reports

# Initialize database tables
Base.metadata.create_all(bind=engine)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

async def redis_listener():
    """Listens to Redis events and pushes them to WebSocket clients."""
    pubsub = await event_bus.get_subscriber(
        "zone.updated", "allocation.recalculated", "agency.status_changed"
    )
    async for message in pubsub.listen():
        if message["type"] == "message":
            data = json.loads(message["data"])
            await manager.broadcast({"channel": message["channel"], "data": data})

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect Redis and start background listener task
    await event_bus.connect()
    listener_task = asyncio.create_task(redis_listener())
    yield
    # Shutdown
    listener_task.cancel()

app = FastAPI(title="Disaster Relief Coordinator Backend", lifespan=lifespan)

# Allow React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reports.router)

@app.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)