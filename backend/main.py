from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import challenges, progress, streak, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="CodeQuest API",
    version="0.1.0",
    description="Backend for the CodeQuest — Duolingo for Coders mobile app",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten per environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,        prefix="/auth",       tags=["auth"])
app.include_router(challenges.router,  prefix="/challenges",  tags=["challenges"])
app.include_router(progress.router,    prefix="/progress",    tags=["progress"])
app.include_router(streak.router,      prefix="/streak",      tags=["streak"])


@app.get("/health")
async def health():
    return {"status": "ok"}
