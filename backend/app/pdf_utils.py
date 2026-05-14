from __future__ import annotations

import io
import re

from pypdf import PdfReader


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def extract_pdf_text(raw_bytes: bytes, max_pages: int = 30) -> str:
    if not raw_bytes:
        return ""
    try:
        reader = PdfReader(io.BytesIO(raw_bytes))
    except Exception:
        return ""
    pages: list[str] = []
    for page in reader.pages[:max_pages]:
        try:
            pages.append(page.extract_text() or "")
        except Exception:
            continue
    return normalize("\n".join(pages))[:80000]


def chunk_text(text: str, words_per_chunk: int = 220, overlap: int = 40) -> list[str]:
    words = (text or "").split()
    if not words:
        return []
    chunks: list[str] = []
    i = 0
    while i < len(words):
        piece = words[i : i + words_per_chunk]
        chunks.append(" ".join(piece))
        if i + words_per_chunk >= len(words):
            break
        i += max(1, words_per_chunk - overlap)
    return chunks[:120]
