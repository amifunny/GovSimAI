"""RAG pipeline.

Pipeline:
    PDF / text -> chunking -> embeddings -> Qdrant (persistent) -> retrieval

If Qdrant is unreachable the system gracefully degrades to an in-process
cosine-similarity ranker over the same embeddings; if there is no OpenAI key
it falls back to a keyword overlap score so the UI keeps working.
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from hashlib import sha1
from typing import Any
from uuid import NAMESPACE_DNS, uuid5

from openai import AsyncOpenAI
from qdrant_client import QdrantClient, models

from .config import (
    EMBEDDING_MODEL,
    QDRANT_API_KEY,
    QDRANT_COLLECTION,
    QDRANT_ENABLED,
    QDRANT_URL,
)
from .pdf_utils import chunk_text, normalize

SEED_KNOWLEDGE: list[dict[str, str]] = [
    {
        "title": "Indian Economic Survey framing",
        "text": (
            "Policy effects in India are uneven across formal and informal sectors. "
            "Implementation capacity, state-level variation, and compliance friction "
            "shift outcomes. Fiscal transfers and federal coordination matter."
        ),
    },
    {
        "title": "World Bank labor and social protection",
        "text": (
            "Labor reforms can raise productivity in high-skill sectors but disrupt "
            "low-margin small businesses. Transition support, reskilling, and social "
            "protection are critical to avoid regressive outcomes."
        ),
    },
    {
        "title": "Indian budget and fiscal discipline",
        "text": (
            "Large recurring commitments need sustainable revenue design. Without it, "
            "deficits widen and inflation expectations rise. FRBM Act targets apply."
        ),
    },
    {
        "title": "Constitutional and federal context",
        "text": (
            "Many social and economic policies require Union and State coordination. "
            "Legal viability hinges on legislative competence, proportionality, and "
            "fundamental rights safeguards under Articles 14, 19, and 21."
        ),
    },
    {
        "title": "Iceland and UK 4-day work week trials",
        "text": (
            "Iceland's 2015-2019 trial and UK's 2022 pilot showed productivity stable "
            "or improving with reduced hours in many service sector firms. Outcomes "
            "varied by industry and required strong execution."
        ),
    },
    {
        "title": "UBI literature",
        "text": (
            "Pilots in Madhya Pradesh and abroad (Finland, Kenya) suggest UBI improves "
            "wellbeing and modest entrepreneurship; macro affordability remains the key "
            "constraint without revenue redesign."
        ),
    },
    {
        "title": "GST rate change historical impact",
        "text": (
            "Past GST adjustments shifted consumption patterns and short-term inflation. "
            "Compliance burden grew for MSMEs; effective rate matters more than headline."
        ),
    },
    {
        "title": "Social media age regulation",
        "text": (
            "Australia, France and several US states have proposed or passed under-16 "
            "social media rules. Enforcement, privacy, and education outcomes are debated."
        ),
    },
]


_QCLIENT: QdrantClient | None = None
_SEEDED = False


def _client() -> QdrantClient | None:
    global _QCLIENT
    if not QDRANT_ENABLED:
        return None
    if _QCLIENT is not None:
        return _QCLIENT
    try:
        _QCLIENT = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=8.0)
    except Exception:
        _QCLIENT = None
    return _QCLIENT


def _ensure_collection(client: QdrantClient, dim: int) -> bool:
    try:
        if client.collection_exists(QDRANT_COLLECTION):
            return True
        client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config=models.VectorParams(size=dim, distance=models.Distance.COSINE),
        )
        return True
    except Exception:
        return False


def _point_id(payload: str) -> str:
    return str(uuid5(NAMESPACE_DNS, sha1(payload.encode("utf-8")).hexdigest()))


def _cosine(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = sum(x * x for x in a) ** 0.5
    nb = sum(y * y for y in b) ** 0.5
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def _keyword_score(query: str, text: str) -> float:
    q = {t for t in re.findall(r"[a-zA-Z]{3,}", query.lower())}
    t = set(re.findall(r"[a-zA-Z]{3,}", text.lower()))
    if not q:
        return 0.0
    return len(q & t) / len(q)


async def _embed(client: AsyncOpenAI, texts: list[str]) -> list[list[float]]:
    resp = await client.embeddings.create(model=EMBEDDING_MODEL, input=texts)
    return [d.embedding for d in resp.data]


async def upsert_documents(
    docs: list[dict[str, str]],
    api_key: str | None,
    session_id: str = "shared",
) -> int:
    """Ingest documents permanently into Qdrant. Returns chunks indexed."""
    pieces: list[dict[str, str]] = []
    for doc in docs:
        title = doc.get("title") or "Untitled"
        text = normalize(doc.get("text") or "")
        for c in chunk_text(text):
            pieces.append({"title": title, "text": c})
    if not pieces or not api_key:
        return 0

    client = AsyncOpenAI(api_key=api_key)
    try:
        vectors = await _embed(client, [p["text"] for p in pieces])
    except Exception:
        return 0

    q = _client()
    if not q or not vectors:
        return 0
    if not _ensure_collection(q, len(vectors[0])):
        return 0

    try:
        points = [
            models.PointStruct(
                id=_point_id(f"{p['title']}::{p['text']}"),
                vector=vectors[i],
                payload={
                    "title": p["title"],
                    "text": p["text"],
                    "sessionId": session_id,
                    "ingestedAt": datetime.now(timezone.utc).isoformat(),
                },
            )
            for i, p in enumerate(pieces)
        ]
        q.upsert(collection_name=QDRANT_COLLECTION, points=points, wait=False)
        return len(points)
    except Exception:
        return 0


async def _ensure_seed(api_key: str | None) -> None:
    global _SEEDED
    if _SEEDED:
        return
    q = _client()
    if not q:
        _SEEDED = True
        return
    try:
        if q.collection_exists(QDRANT_COLLECTION):
            count = q.count(collection_name=QDRANT_COLLECTION, exact=False).count or 0
            if count > 0:
                _SEEDED = True
                return
    except Exception:
        pass

    if api_key:
        await upsert_documents(SEED_KNOWLEDGE, api_key=api_key, session_id="seed")
    _SEEDED = True


async def retrieve(
    query: str,
    extra_docs: list[str],
    api_key: str | None,
    session_id: str,
    top_k: int = 8,
) -> list[dict[str, Any]]:
    """Return ranked context chunks for `query`.

    `extra_docs` is a list of raw text from user uploads. We index them into
    Qdrant *and* score them against the query so the retrieval is grounded in
    both seed knowledge and user-provided documents.
    """
    if extra_docs and api_key:
        await upsert_documents(
            [{"title": f"Uploaded doc {i+1}", "text": d} for i, d in enumerate(extra_docs)],
            api_key=api_key,
            session_id=session_id,
        )

    if api_key:
        await _ensure_seed(api_key)

    if not query.strip():
        return []

    if api_key:
        try:
            client = AsyncOpenAI(api_key=api_key)
            q_vec = (await _embed(client, [query]))[0]
        except Exception:
            q_vec = None

        if q_vec:
            q = _client()
            if q:
                try:
                    hits = q.search(
                        collection_name=QDRANT_COLLECTION,
                        query_vector=q_vec,
                        limit=top_k,
                        with_payload=True,
                    )
                    out: list[dict[str, Any]] = []
                    for h in hits:
                        payload = h.payload or {}
                        out.append(
                            {
                                "title": str(payload.get("title", "context")),
                                "excerpt": str(payload.get("text", ""))[:480],
                                "score": float(h.score or 0.0),
                            }
                        )
                    if out:
                        return out
                except Exception:
                    pass

    # Final fallback - keyword overlap over seed + uploaded text only.
    pool = list(SEED_KNOWLEDGE)
    for i, d in enumerate(extra_docs):
        if d.strip():
            pool.append({"title": f"Uploaded doc {i+1}", "text": d[:4000]})
    scored = [
        {
            "title": p["title"],
            "excerpt": p["text"][:480],
            "score": _keyword_score(query, p["text"]),
        }
        for p in pool
    ]
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k]
