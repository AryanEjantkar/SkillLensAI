"""Vercel Serverless Function entry point for FastAPI backend."""

import logging
import os
import sys
import traceback
from pathlib import Path

logger = logging.getLogger(__name__)

# Ensure project root and subpackages are always on sys.path
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent

for candidate in [PROJECT_ROOT, PROJECT_ROOT / "backend", CURRENT_DIR]:
    path_str = str(candidate)
    if path_str not in sys.path:
        sys.path.insert(0, path_str)

try:
    from backend.src.main import app
except Exception as error:
    logger.exception("Failed to initialize FastAPI application on Vercel: %s", error)
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI(title="SkillLens AI Deployment Diagnostic")

    @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE"])
    async def diagnostic_fallback(path_name: str):
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": "FastAPI failed to start on Vercel",
                "error": str(error),
                "error_type": type(error).__name__,
                "traceback": traceback.format_exc(),
                "sys_path": sys.path,
                "cwd": os.getcwd(),
                "files_in_root": os.listdir(str(PROJECT_ROOT)) if PROJECT_ROOT.exists() else [],
            },
        )

__all__ = ["app"]
