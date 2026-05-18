from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ApiError(Exception):
    code: str
    message: str
    status_code: int = 400


class SyncExecutionDisabled(ApiError):
    def __init__(self):
        super().__init__(
            code="SYNC_EXECUTION_DISABLED",
            message="Synchronous API execution is disabled. Use async task execution in production.",
            status_code=409,
        )


class InvalidRequest(ApiError):
    def __init__(self, message: str):
        super().__init__(code="INVALID_REQUEST", message=message, status_code=400)


class NotFound(ApiError):
    def __init__(self, message: str):
        super().__init__(code="NOT_FOUND", message=message, status_code=404)
