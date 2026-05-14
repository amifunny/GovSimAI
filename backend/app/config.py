from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

REASONING_MODEL = os.getenv("GOVSIM_REASONING_MODEL", "gpt-4o-mini")
EMBEDDING_MODEL = os.getenv("GOVSIM_EMBEDDING_MODEL", "text-embedding-3-small")

QDRANT_ENABLED = os.getenv("QDRANT_ENABLED", "true").lower() in ("1", "true", "yes")
QDRANT_URL = os.getenv("QDRANT_URL", "http://127.0.0.1:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "").strip() or None
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "govsim_kb")

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
MEMORY_FILE = DATA_DIR / "memory.json"


def resolve_api_key(header_value: str | None) -> str | None:
    """Prefer the user-provided BYOK key from the request header; fall back to env."""
    if header_value:
        candidate = header_value.strip()
        if candidate and candidate.lower() != "null" and candidate != "sk-...":
            return candidate
    env_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if env_key and env_key != "sk-...":
        return env_key
    return None


def allowed_origins() -> list[str]:
    raw = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    )
    return [o.strip() for o in raw.split(",") if o.strip()]
