import contextvars
import json
import logging
import logging.config
import os
from datetime import datetime, timezone

# Service-wide request/job identifier stored per-context (async-safe)
request_id_var: contextvars.ContextVar[str | None] = contextvars.ContextVar("request_id", default=None)

SERVICE_NAME = "surf-tracker"
_RESERVED_LOG_KEYS = frozenset(
    logging.LogRecord("", 0, "", 0, "", (), None).__dict__.keys()
) | {"message", "asctime"}
_ORIGINAL_LOG_RECORD_FACTORY = logging.getLogRecordFactory()


def get_request_id() -> str:
    """Return the current request/job id or a placeholder."""
    return request_id_var.get() or "-"


def _record_factory_with_context(*args, **kwargs) -> logging.LogRecord:
    """Attach request/service context to all records before handlers run."""
    record = _ORIGINAL_LOG_RECORD_FACTORY(*args, **kwargs)
    if "request_id" not in record.__dict__:
        record.request_id = get_request_id()
    if "service" not in record.__dict__:
        record.service = SERVICE_NAME
    return record


# Make request/service context available even before configure_logging()
logging.setLogRecordFactory(_record_factory_with_context)


class RequestIdFilter(logging.Filter):
    """Inject request_id and service into all log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id()
        record.service = SERVICE_NAME
        return True


class JsonFormatter(logging.Formatter):
    """Format logs as single-line JSON suitable for ingestion."""

    def format(self, record: logging.LogRecord) -> str:  # pragma: no cover - formatting logic
        base = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "service": getattr(record, "service", SERVICE_NAME),
            "request_id": getattr(record, "request_id", get_request_id()),
            "module": record.module,
            "line": record.lineno,
        }

        # Capture stacktrace when present
        if record.exc_info:
            base["exc_info"] = self.formatException(record.exc_info)

        for key, value in record.__dict__.items():
            if key not in base and key not in _RESERVED_LOG_KEYS and not key.startswith("_"):
                base[key] = value

        return json.dumps(base, ensure_ascii=False, default=repr)


def _resolve_log_level(env_var: str) -> int:
    level_raw = os.getenv(env_var, "INFO").strip()
    if not level_raw:
        return logging.INFO

    # Allow numeric values (e.g. LOG_LEVEL=20)
    if level_raw.lstrip("-").isdigit():
        level_num = int(level_raw)
        return level_num if level_num >= 0 else logging.INFO

    level_name = level_raw.upper()
    level_map = {
        "CRITICAL": logging.CRITICAL,
        "FATAL": logging.CRITICAL,
        "ERROR": logging.ERROR,
        "WARNING": logging.WARNING,
        "WARN": logging.WARNING,
        "INFO": logging.INFO,
        "DEBUG": logging.DEBUG,
        "NOTSET": logging.NOTSET,
    }
    return level_map.get(level_name, logging.INFO)


def configure_logging(log_level_env: str = "LOG_LEVEL") -> None:
    """Configure structured logging for app, uvicorn and worker contexts."""

    level = _resolve_log_level(log_level_env)
    logging.setLogRecordFactory(_record_factory_with_context)

    logging.config.dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "json": {
                    "()": "app.logging.JsonFormatter",
                }
            },
            "filters": {
                "request_id_filter": {
                    "()": "app.logging.RequestIdFilter",
                }
            },
            "handlers": {
                "stdout": {
                    "class": "logging.StreamHandler",
                    "formatter": "json",
                    "filters": ["request_id_filter"],
                    "stream": "ext://sys.stdout",
                },
            },
            "root": {
                "handlers": ["stdout"],
                "level": level,
            },
            "loggers": {
                "uvicorn": {
                    "handlers": [],
                    "propagate": True,
                },
                "uvicorn.access": {
                    "handlers": [],
                    "propagate": True,
                },
                "apscheduler": {
                    "handlers": [],
                    "propagate": True,
                },
                "sqlalchemy": {
                    "handlers": [],
                    "level": "WARNING",
                    "propagate": True,
                },
                "sqlalchemy.engine": {
                    "handlers": [],
                    "level": "WARNING",
                    "propagate": True,
                },
                "sqlalchemy.pool": {
                    "handlers": [],
                    "level": "WARNING",
                    "propagate": True,
                },
            },
        }
    )
