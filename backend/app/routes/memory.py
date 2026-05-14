from __future__ import annotations

from fastapi import APIRouter

from ..memory import get_session, memory_note

router = APIRouter()


@router.get("/memory/{session_id}")
def read_memory(session_id: str) -> dict:
    profile = get_session(session_id)
    return {
        "session_id": session_id,
        "profile": profile,
        "note": memory_note(profile),
    }
