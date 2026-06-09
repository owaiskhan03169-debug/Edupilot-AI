from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client: AsyncIOMotorClient = None
db = None

async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client.edupilot
    print("✅ MongoDB connected")

async def close_db():
    global client
    if client:
        client.close()
        print("MongoDB disconnected")

def get_db():
    return db