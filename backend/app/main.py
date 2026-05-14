from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import allowed_origins
from .routes import analyze, battle, health, ingest, memory, simulate

app = FastAPI(
    title="GovSim AI API",
    description=(
        "Multi-agent Indian public-policy simulator. Endpoints expose policy "
        "analysis, policy battle mode, a future simulator, document ingestion "
        "into Qdrant, MCP tool insights, and session memory."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins() or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["meta"])
app.include_router(analyze.router, prefix="/api", tags=["policy"])
app.include_router(battle.router, prefix="/api", tags=["policy"])
app.include_router(simulate.router, prefix="/api", tags=["policy"])
app.include_router(ingest.router, prefix="/api", tags=["rag"])
app.include_router(memory.router, prefix="/api", tags=["memory"])


@app.get("/")
def root() -> dict:
    return {"name": "GovSim AI API", "ok": True}
