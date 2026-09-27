"""
SkillSwap API — FastAPI application entrypoint.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import ALLOWED_ORIGINS
from app.database import engine, Base
from app.routers import auth, users, skills, matching, exchange_requests, sessions, reviews, credits

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SkillSwap API",
    description="Student peer-to-peer skill exchange platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers under /api/v1
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(skills.router, prefix="/api/v1")
app.include_router(matching.router, prefix="/api/v1")
app.include_router(exchange_requests.router, prefix="/api/v1")
app.include_router(sessions.router, prefix="/api/v1")
app.include_router(reviews.router, prefix="/api/v1")
app.include_router(credits.router, prefix="/api/v1")


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "skillswap"}
