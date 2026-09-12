import json
import redis.asyncio as aioredis
from app.core.config import settings

class EventBus:
    def __init__(self):
        self.redis_url = settings.REDIS_URL
        self.redis = None

    async def connect(self):
        self.redis = aioredis.from_url(self.redis_url, decode_responses=True)

    async def publish(self, topic: str, message: dict):
        if not self.redis:
            await self.connect()
        await self.redis.publish(topic, json.dumps(message))

    async def get_subscriber(self, *topics):
        if not self.redis:
            await self.connect()
        pubsub = self.redis.pubsub()
        await pubsub.subscribe(*topics)
        return pubsub

event_bus = EventBus()