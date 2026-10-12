# backend/app/api/router.py
from fastapi import APIRouter

from app.api.routes import health, learning

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(learning.router)
