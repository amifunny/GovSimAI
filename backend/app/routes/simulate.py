from __future__ import annotations

from fastapi import APIRouter, Body, Header

from ..agents import run_future_simulator
from ..config import resolve_api_key
from ..pdf_utils import normalize
from ..rag import retrieve

router = APIRouter()


@router.post("/simulate")
async def simulate(
    payload: dict = Body(default={}),
    x_openai_api_key: str | None = Header(default=None, alias="x-openai-api-key"),
) -> dict:
    api_key = resolve_api_key(x_openai_api_key)
    policy_text = normalize(payload.get("policy_text") or "")
    session_id = str(payload.get("session_id") or "default")
    sources = await retrieve(
        query=policy_text, extra_docs=[], api_key=api_key, session_id=session_id
    )
    future = await run_future_simulator(
        policy_text=policy_text, sources=sources, api_key=api_key
    )
    return {"future": future, "sources": sources}
