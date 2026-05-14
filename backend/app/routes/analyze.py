from __future__ import annotations

from fastapi import APIRouter, File, Form, Header, UploadFile

from ..agents import run_analysis
from ..config import resolve_api_key
from ..mcp import run_all_tools
from ..memory import memory_note, update_session
from ..pdf_utils import extract_pdf_text, normalize
from ..rag import retrieve

router = APIRouter()


async def _read_uploads(files: list[UploadFile] | None) -> list[str]:
    docs: list[str] = []
    for uploaded in files or []:
        raw = await uploaded.read()
        name = (uploaded.filename or "").lower()
        if name.endswith(".pdf"):
            text = extract_pdf_text(raw)
        else:
            try:
                text = raw.decode("utf-8", errors="ignore")
            except Exception:
                text = ""
        if text and text.strip():
            docs.append(text)
    return docs


@router.post("/analyze")
async def analyze(
    policy_text: str = Form(default=""),
    policy_b_text: str = Form(default=""),
    mode: str = Form(default="single"),
    session_id: str = Form(default="default"),
    files: list[UploadFile] | None = File(default=None),
    x_openai_api_key: str | None = Header(default=None, alias="x-openai-api-key"),
) -> dict:
    api_key = resolve_api_key(x_openai_api_key)
    mode_final = "battle" if mode == "battle" else "single"

    primary = normalize(policy_text)
    secondary = normalize(policy_b_text)
    uploaded_docs = await _read_uploads(files)

    profile = update_session(
        session_id=session_id,
        policy_text=f"{primary} {secondary}",
        viewpoint=primary[:80],
    )
    note = memory_note(profile)

    sources = await retrieve(
        query=f"{primary}\n{secondary}".strip(),
        extra_docs=uploaded_docs,
        api_key=api_key,
        session_id=session_id,
    )

    mcp_insights = await run_all_tools(
        policy_text=primary,
        policy_b_text=secondary,
        mode=mode_final,
        uploaded_docs=uploaded_docs,
    )

    result = await run_analysis(
        policy_text=primary,
        policy_b_text=secondary,
        mode=mode_final,
        memory_note=note,
        sources=sources,
        mcp_insights=mcp_insights,
        api_key=api_key,
    )
    return result
