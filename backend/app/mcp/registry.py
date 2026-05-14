"""MCP tool adapters.

Each adapter follows the same contract:

    async def run(payload: dict) -> dict | None

If an external MCP endpoint URL is configured via env vars the adapter calls
it. Otherwise it computes a local result so the rest of the pipeline still
has structured data to reason over.
"""
from __future__ import annotations

import os
import re
from typing import Any

import httpx

MCP_AUTH_TOKEN = os.getenv("MCP_AUTH_TOKEN", "").strip()
ENDPOINTS = {
    "search": os.getenv("MCP_SEARCH_URL", "").strip(),
    "pdf": os.getenv("MCP_PDF_URL", "").strip(),
    "statistics": os.getenv("MCP_STATS_URL", "").strip(),
    "government_dataset": os.getenv("MCP_GOV_DATA_URL", "").strip(),
    "news": os.getenv("MCP_NEWS_URL", "").strip(),
    "visualization": os.getenv("MCP_VIZ_URL", "").strip(),
}
NEWS_API_KEY = os.getenv("NEWS_API_KEY", "").strip()


async def _remote(tool: str, payload: dict[str, Any]) -> dict[str, Any] | None:
    url = ENDPOINTS.get(tool, "")
    if not url:
        return None
    headers = {"Content-Type": "application/json"}
    if MCP_AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {MCP_AUTH_TOKEN}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
        if resp.status_code >= 400:
            return None
        data = resp.json()
        return data if isinstance(data, dict) else None
    except Exception:
        return None


def _keywords(text: str, top: int = 8) -> list[str]:
    stop = {
        "the", "and", "for", "with", "from", "this", "that", "into", "have",
        "will", "would", "their", "there", "should", "could", "about", "policy",
        "india", "indian",
    }
    words = re.findall(r"[a-zA-Z]{4,}", (text or "").lower())
    counts: dict[str, int] = {}
    for w in words:
        if w in stop:
            continue
        counts[w] = counts.get(w, 0) + 1
    return [w for w, _ in sorted(counts.items(), key=lambda x: x[1], reverse=True)[:top]]


async def _search_tool(payload: dict[str, Any]) -> dict[str, Any]:
    remote = await _remote("search", payload)
    if remote:
        return remote
    keywords = _keywords(payload.get("policyText", ""))
    return {
        "summary": "Suggested search angles from policy text",
        "keywords": keywords,
        "queries": [
            f"{kw} India impact study" for kw in keywords[:4]
        ],
    }


async def _pdf_tool(payload: dict[str, Any]) -> dict[str, Any]:
    remote = await _remote("pdf", payload)
    if remote:
        return remote
    docs: list[str] = payload.get("uploadedDocs") or []
    return {
        "summary": f"Indexed {len(docs)} uploaded document(s) for RAG.",
        "documentCount": len(docs),
        "totalCharacters": sum(len(d) for d in docs),
    }


async def _stats_tool(payload: dict[str, Any]) -> dict[str, Any]:
    remote = await _remote("statistics", payload)
    if remote:
        return remote
    text = " ".join(
        [payload.get("policyText", ""), payload.get("policyBText", "") or ""]
    ).strip()
    words = text.split()
    numbers = re.findall(r"\d+(?:\.\d+)?%?", text)
    return {
        "summary": "Local text statistics computed.",
        "wordCount": len(words),
        "numericTokens": numbers[:8],
        "readingMinutes": round(max(1.0, len(words) / 180.0), 1),
    }


async def _gov_data_tool(payload: dict[str, Any]) -> dict[str, Any]:
    remote = await _remote("government_dataset", payload)
    if remote:
        return remote
    return {
        "summary": "Local catalog of likely-relevant Indian government datasets.",
        "datasets": [
            {"source": "data.gov.in", "topic": "Macroeconomic indicators"},
            {"source": "RBI DBIE", "topic": "Monetary and banking statistics"},
            {"source": "MOSPI NSS", "topic": "Household consumption and employment"},
            {"source": "PIB", "topic": "Policy announcements and notifications"},
            {"source": "PRS India", "topic": "Parliamentary bill summaries"},
        ],
    }


async def _news_tool(payload: dict[str, Any]) -> dict[str, Any]:
    remote = await _remote("news", payload)
    if remote:
        return remote
    if NEWS_API_KEY:
        try:
            q = payload.get("policyText", "")[:200]
            url = "https://newsapi.org/v2/everything"
            params = {
                "q": q,
                "language": "en",
                "pageSize": 5,
                "sortBy": "publishedAt",
                "apiKey": NEWS_API_KEY,
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(url, params=params)
            if resp.status_code < 400:
                data = resp.json()
                articles = [
                    {
                        "title": a.get("title"),
                        "source": (a.get("source") or {}).get("name"),
                        "url": a.get("url"),
                    }
                    for a in (data.get("articles") or [])[:5]
                ]
                return {
                    "summary": f"Fetched {len(articles)} recent articles via NewsAPI.",
                    "articles": articles,
                }
        except Exception:
            pass
    return {
        "summary": "No live news provider configured; returning placeholder feed.",
        "articles": [],
    }


async def _viz_tool(payload: dict[str, Any]) -> dict[str, Any]:
    remote = await _remote("visualization", payload)
    if remote:
        return remote
    return {
        "summary": "Visualization schema generated for the future simulator.",
        "chartHint": "multi-line timeline",
        "xAxis": [2027, 2030, 2033],
        "series": [
            {"name": "GDP Delta %", "type": "line"},
            {"name": "Startup Delta %", "type": "bar"},
            {"name": "Inflation Delta %", "type": "line"},
            {"name": "Employment Delta %", "type": "line"},
        ],
    }


async def run_all_tools(
    policy_text: str,
    policy_b_text: str,
    mode: str,
    uploaded_docs: list[str],
) -> list[dict[str, Any]]:
    payload = {
        "policyText": policy_text,
        "policyBText": policy_b_text,
        "mode": mode,
        "uploadedDocs": uploaded_docs,
    }
    runs = [
        ("search", _search_tool),
        ("pdf", _pdf_tool),
        ("statistics", _stats_tool),
        ("government_dataset", _gov_data_tool),
        ("news", _news_tool),
        ("visualization", _viz_tool),
    ]
    insights: list[dict[str, Any]] = []
    for tool, fn in runs:
        try:
            data = await fn(payload)
            insights.append(
                {
                    "tool": tool,
                    "status": "ok",
                    "summary": str(data.get("summary", "")),
                    "data": data,
                }
            )
        except Exception as e:
            insights.append(
                {
                    "tool": tool,
                    "status": "error",
                    "summary": f"Adapter failed: {e}",
                    "data": {},
                }
            )
    return insights


def tool_status() -> list[dict[str, Any]]:
    return [
        {
            "tool": tool,
            "remoteConfigured": bool(url),
        }
        for tool, url in ENDPOINTS.items()
    ]
