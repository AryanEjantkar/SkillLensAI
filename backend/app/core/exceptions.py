# backend/app/core/exceptions.py
from typing import Any, Optional


class SkillLensException(Exception):
    """Base exception for all SkillLens AI application errors."""
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", status_code: int = 500, details: Optional[Any] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details


class ConfigurationError(SkillLensException):
    """Raised when application configuration or credentials are missing/invalid."""
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message, code="CONFIG_ERROR", status_code=500, details=details)


class ContentValidationError(SkillLensException):
    """Raised when client input data or file fails validation rules."""
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message, code="VALIDATION_ERROR", status_code=400, details=details)


class MultimodalUnsupportedError(SkillLensException):
    """Raised when multimodal (image) generation is requested on an unverified/unsupported model."""
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message, code="MULTIMODAL_UNSUPPORTED", status_code=422, details=details)


class AIProviderError(SkillLensException):
    """Raised when an external AI provider fails or returns an error."""
    def __init__(self, message: str, status_code: int = 502, code: str = "AI_PROVIDER_ERROR", details: Optional[Any] = None):
        super().__init__(message, code=code, status_code=status_code, details=details)


class AIUpstreamTimeoutError(AIProviderError):
    """Raised when upstream AI request times out."""
    def __init__(self, message: str = "Upstream AI provider timed out.", details: Optional[Any] = None):
        super().__init__(message, status_code=504, code="AI_TIMEOUT", details=details)


class AIModelNotFoundError(AIProviderError):
    """Raised when the specified model is not found or accessible."""
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message, status_code=502, code="MODEL_NOT_FOUND", details=details)


class InvalidModelOutputError(SkillLensException):
    """Raised when the model output cannot be parsed into the expected structured schema."""
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message, code="INVALID_MODEL_OUTPUT", status_code=502, details=details)
