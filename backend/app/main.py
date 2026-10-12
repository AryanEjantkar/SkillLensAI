# backend/app/main.py
"""
SkillLens AI Backend Application Entry Point.
Responsible exclusively for initializing FastAPI, registering middleware,
configuring global exception handlers, and mounting API routers.
"""
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import get_settings
from app.core.exceptions import SkillLensException
from app.core.logging import get_logger, setup_logging
from app.schemas.errors import ErrorDetail, ErrorResponse

settings = get_settings()
setup_logging(debug=settings.DEBUG)
logger = get_logger("app.main")


def create_application() -> FastAPI:
    """Factory function initializing the configured FastAPI application."""
    app = FastAPI(
        title=settings.APP_NAME,
        description="SkillLens AI educational backend powered by Google's Gemma 4 model.",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc"
    )

    # 1. CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 2. Centralized Exception Handlers

    @app.exception_handler(SkillLensException)
    async def skilllens_exception_handler(request: Request, exc: SkillLensException) -> JSONResponse:
        """Handles all domain-specific application exceptions."""
        logger.warning("Application exception [%s] on %s: %s", exc.code, request.url.path, exc.message)
        payload = ErrorResponse(
            error=ErrorDetail(
                code=exc.code,
                message=exc.message,
                details=exc.details
            )
        )
        return JSONResponse(status_code=exc.status_code, content=payload.model_dump())

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        """Handles Pydantic / FastAPI request validation errors."""
        logger.info("Validation error on %s: %s", request.url.path, exc.errors())
        # Format errors into clean, non-sensitive summary
        simplified_errors = [
            {"field": ".".join(str(loc) for loc in err.get("loc", [])), "message": err.get("msg", "")}
            for err in exc.errors()
        ]
        payload = ErrorResponse(
            error=ErrorDetail(
                code="REQUEST_VALIDATION_ERROR",
                message="Invalid request parameters or payload structure.",
                details=simplified_errors
            )
        )
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=payload.model_dump())

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Catch-all handler for unexpected internal errors (masks stack traces and internals)."""
        logger.error("Unhandled exception on %s: %s", request.url.path, exc, exc_info=True)
        payload = ErrorResponse(
            error=ErrorDetail(
                code="INTERNAL_SERVER_ERROR",
                message="An unexpected server error occurred. Please try again later."
            )
        )
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=payload.model_dump())

    # 3. Mount Routers
    app.include_router(api_router, prefix=settings.API_PREFIX)

    return app


app = create_application()
