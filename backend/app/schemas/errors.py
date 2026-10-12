# backend/app/schemas/errors.py
from typing import Any, Optional
from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    """Detailed error object for client responses."""
    code: str = Field(description="Machine-readable error code")
    message: str = Field(description="Human-readable error description")
    details: Optional[Any] = Field(default=None, description="Optional diagnostic details (non-sensitive)")


class ErrorResponse(BaseModel):
    """Consistent standard API error envelope."""
    error: ErrorDetail
