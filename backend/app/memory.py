"""Lightweight on-disk session memory.

Tracks topical preferences per session id so agents can adapt their tone and
focus across multiple runs (e.g. "user often studies education policy").
Persistent across restarts via a single JSON file on disk.
"""
from __future__ import annotations

import json
import threading
from typing import Any

from .config import MEMORY_FILE

_LOCK = threading.Lock()

_TOPIC_SIGNALS: dict[str, list[str]] = {
    "economy": ["gdp", "tax", "gst", "inflation", "budget", "fiscal", "deficit"],
    "education": ["education", "school", "student", "university", "curriculum"],
    "labor": ["job", "employment", "wage", "work week", "labor", "labour", "gig"],
    "social": ["welfare", "poverty", "inequality", "rural", "tribal", "minority"],
    "tech": ["ai", "internet", "data", "tech", "startup", "platform"],
    "environment": ["climate", "carbon", "pollution", "renewable", "forest", "water"],
    "health": ["health", "hospital", "vaccine", "insurance", "ayushman"],
    "governance": ["election", "parliament", "court", "constitution", "rights"],
}


def _read_all() -> dict[str, Any]:
    if not MEMORY_FILE.exists():
        return {}
    try:
        return json.loads(MEMORY_FILE.read_text("utf-8") or "{}")
    except Exception:
        return {}


def _write_all(data: dict[str, Any]) -> None:
    MEMORY_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), "utf-8")


def get_session(session_id: str) -> dict[str, Any]:
    with _LOCK:
        return _read_all().get(session_id, {"topics": {}, "runs": 0, "lastViewpoints": []})


def update_session(session_id: str, policy_text: str, viewpoint: str | None = None) -> dict[str, Any]:
    """Update topical counts based on the latest policy text."""
    text = (policy_text or "").lower()
    with _LOCK:
        store = _read_all()
        profile = store.get(
            session_id, {"topics": {}, "runs": 0, "lastViewpoints": []}
        )
        topics: dict[str, int] = profile.get("topics", {})
        for topic, words in _TOPIC_SIGNALS.items():
            if any(w in text for w in words):
                topics[topic] = topics.get(topic, 0) + 1
        profile["topics"] = topics
        profile["runs"] = int(profile.get("runs", 0)) + 1
        if viewpoint:
            history = list(profile.get("lastViewpoints", []))
            history.append(viewpoint)
            profile["lastViewpoints"] = history[-5:]
        store[session_id] = profile
        _write_all(store)
        return profile


def memory_note(profile: dict[str, Any]) -> str:
    topics: dict[str, int] = profile.get("topics", {}) or {}
    runs = profile.get("runs", 0)
    if not topics:
        return f"First {runs} run(s) in this session; no preference signal yet."
    ranked = sorted(topics.items(), key=lambda x: x[1], reverse=True)[:3]
    top = ", ".join(f"{k} ({v})" for k, v in ranked)
    return f"Session has {runs} run(s); strongest interests: {top}."
