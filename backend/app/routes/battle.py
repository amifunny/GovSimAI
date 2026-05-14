from __future__ import annotations

from fastapi import APIRouter, Body, Header

from ..agents import run_battle
from ..config import resolve_api_key
from ..pdf_utils import normalize
from ..rag import retrieve

router = APIRouter()


@router.post("/battle")
async def battle(
    payload: dict = Body(default={}),
    x_openai_api_key: str | None = Header(default=None, alias="x-openai-api-key"),
) -> dict:
    api_key = resolve_api_key(x_openai_api_key)
    a = normalize(payload.get("policy_a") or "")
    b = normalize(payload.get("policy_b") or "")
    session_id = str(payload.get("session_id") or "default")
    sources = await retrieve(
        query=f"{a}\n{b}", extra_docs=[], api_key=api_key, session_id=session_id
    )
    turns = await run_battle(policy_a=a, policy_b=b, sources=sources, api_key=api_key)
    return {"turns": turns, "sources": sources}
