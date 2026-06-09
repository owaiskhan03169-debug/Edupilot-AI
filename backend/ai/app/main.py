from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.database import close_db, connect_db
from app.api.routes import (
    attendance,
    fees,
    homework,
    ai_workflow,
    students,
    teachers,
    notifications,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="EduPilot AI",
    description="AI-Powered School Operations System",
    version="1.0.0",
    lifespan=lifespan,
)


# ─── Register All Routers ────────────────────
app.include_router(students.router)
app.include_router(teachers.router)
app.include_router(attendance.router)
app.include_router(fees.router)
app.include_router(homework.router)
app.include_router(ai_workflow.router)
app.include_router(notifications.router)


@app.get("/", summary="Health Check")
async def root() -> dict:
    return {"message": "EduPilot AI Backend is Running!"}