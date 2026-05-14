from __future__ import annotations

from fastapi import APIRouter

from ..agents import AGENT_ROSTER
from ..config import QDRANT_COLLECTION, QDRANT_ENABLED, QDRANT_URL, REASONING_MODEL
from ..mcp import tool_status

router = APIRouter()


@router.get("/health")
def health() -> dict:
    return {
        "ok": True,
        "model": REASONING_MODEL,
        "qdrant": {
            "enabled": QDRANT_ENABLED,
            "url": QDRANT_URL,
            "collection": QDRANT_COLLECTION,
        },
        "agents": AGENT_ROSTER,
        "mcp": tool_status(),
    }
