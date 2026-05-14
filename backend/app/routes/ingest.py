from __future__ import annotations

from fastapi import APIRouter, File, Form, Header, UploadFile

from ..config import resolve_api_key
from ..pdf_utils import extract_pdf_text
from ..rag import upsert_documents

router = APIRouter()


@router.post("/ingest")
async def ingest(
    session_id: str = Form(default="default"),
    files: list[UploadFile] | None = File(default=None),
    x_openai_api_key: str | None = Header(default=None, alias="x-openai-api-key"),
) -> dict:
    api_key = resolve_api_key(x_openai_api_key)
    docs: list[dict[str, str]] = []
    for uploaded in files or []:
        raw = await uploaded.read()
        name = (uploaded.filename or "doc").strip()
        if name.lower().endswith(".pdf"):
            text = extract_pdf_text(raw)
        else:
            try:
                text = raw.decode("utf-8", errors="ignore")
            except Exception:
                text = ""
        if text.strip():
            docs.append({"title": name, "text": text})

    if not docs:
        return {"ok": False, "chunks_indexed": 0, "reason": "No readable documents."}
    if not api_key:
        return {"ok": False, "chunks_indexed": 0, "reason": "Missing OpenAI API key."}

    n = await upsert_documents(docs, api_key=api_key, session_id=session_id)
    return {"ok": n > 0, "chunks_indexed": n}
