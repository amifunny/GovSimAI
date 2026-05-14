# GovSim AI · Backend (FastAPI)

FastAPI service that powers GovSim AI. Multi-agent policy reasoning, RAG over Qdrant, MCP tool adapters, and session memory.

## Run locally

```bash
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Open the OpenAPI docs at <http://127.0.0.1:8000/docs>.

## Layout

```
backend/app/
├── main.py                  FastAPI entrypoint + CORS
├── config.py                env + BYOK key resolution
├── schemas.py               pydantic models for typed responses
├── memory.py                persistent session memory (data/memory.json)
├── pdf_utils.py             PDF extraction + chunking
├── rag.py                   embeddings + Qdrant upsert + retrieval
├── mcp/                     MCP tool adapters (search/pdf/stats/gov/news/viz)
│   └── registry.py
├── agents/
│   ├── personas.py          static agent personas
│   └── orchestrator.py      run_analysis / run_battle / run_future_simulator
└── routes/
    ├── analyze.py           /api/analyze  - full multi-agent run
    ├── battle.py            /api/battle   - debate-only
    ├── simulate.py          /api/simulate - future projections
    ├── ingest.py            /api/ingest   - upsert docs to Qdrant
    ├── memory.py            /api/memory   - read session profile
    └── health.py            /api/health   - status + tool config
```

## BYOK header

Every request can include an `x-openai-api-key: sk-...` header. If present it is used for that request only (never logged). If absent, the backend tries the `OPENAI_API_KEY` env var. If neither exists the API returns deterministic demo data so the UI still works.

## Qdrant

By default the backend talks to `http://127.0.0.1:6333`. Run Qdrant with:

```bash
docker run -p 6333:6333 -v $(pwd)/qdrant_data:/qdrant/storage qdrant/qdrant
```

The collection is created lazily on first use and is named `govsim_kb` (configurable via `QDRANT_COLLECTION`).
