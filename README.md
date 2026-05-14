# GovSim AI

Multi-agent public-policy evaluation platform for India. Type a policy, drop in PDFs, and get a structured verdict from **8 specialised AI agents** with RAG over a persistent vector DB, MCP tool adapters, session memory, a policy **Battle Mode**, and a **Future Simulator**.

```
GovSimAI/
├── backend/     FastAPI + Qdrant RAG + MCP adapters + multi-agent orchestrator
└── frontend/    Next.js 15 (App Router, TS, Tailwind v4) UI
```

The user brings their own OpenAI API key (BYOK). The key is stored only in the browser's `localStorage` and sent as a per-request header to the backend.

---

## Highlights

- **8 specialised agents**: Economist, Social, Political, Legal, Environmental, Historian, Critic, and Citizen (with student / middle-class / business / rural / startup sub-personas).
- **RAG with Qdrant**: PDF/text ingestion -> chunking -> OpenAI embeddings -> persistent Qdrant collection -> top-k retrieval per run.
- **MCP tool adapters**: Search, PDF, Statistics, Government dataset, News, Visualization. Each adapter calls an HTTP endpoint if configured, otherwise it falls back to a local implementation.
- **Session memory** persisted to disk so agents adapt to the user's topical preferences across runs.
- **Policy Battle Mode**: pit two policies against each other and watch a 3-round live debate.
- **Future Simulator**: 2027 / 2030 / 2033 snapshots for GDP, startups, inflation, employment.
- **BYOK + local-only history**: no backend storage, no signup.

---

## Quick start

### 1. Run Qdrant locally (optional but recommended for persistence)

```bash
docker run -p 6333:6333 -v $(pwd)/qdrant_data:/qdrant/storage qdrant/qdrant
```

### 2. Start the FastAPI backend

```bash
cd backend
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # tweak Qdrant + MCP URLs as needed
uvicorn app.main:app --reload --port 8000
```

### 3. Start the Next.js frontend

```bash
cd ../frontend
cp .env.example .env.local  # NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
npm install
npm run dev
```

Open <http://localhost:3000>. Paste your OpenAI key into the **OpenAI key** panel, then run a policy.

---

## Architecture

```
                     ┌─────────────────────────────────────┐
   user / browser    │   Next.js  (Policy Lab, Battle,     │
   BYOK OpenAI key   │   History, Report)                  │
                     └───────────────────┬─────────────────┘
                                         │  multipart/form-data + x-openai-api-key
                                         ▼
                     ┌─────────────────────────────────────┐
                     │  FastAPI /api/analyze               │
                     │   ├── pdf extraction                │
                     │   ├── memory (disk JSON, per session)
                     │   ├── RAG (Qdrant: embed + upsert + search)
                     │   ├── MCP adapters (search/pdf/stats/gov/news/viz)
                     │   ├── 8 agents in parallel (OpenAI)
                     │   └── synthesizer -> scorecard + future + critic
                     └─────────────────────────────────────┘
```

### Endpoints

| Method | Path                  | What it does                                       |
| ------ | --------------------- | -------------------------------------------------- |
| GET    | `/api/health`         | model + Qdrant + MCP tool status                   |
| POST   | `/api/analyze`        | full multi-agent run (single or battle mode)       |
| POST   | `/api/battle`         | debate-only mode for two policies                  |
| POST   | `/api/simulate`       | future projections only                            |
| POST   | `/api/ingest`         | upsert PDFs/text into Qdrant for the session       |
| GET    | `/api/memory/{sid}`   | inspect what the system has learned about a session |

### MCP tool adapters

Each tool follows the same contract. Set the env var if you have a real MCP HTTP endpoint, otherwise the local fallback is used:

| Tool                  | Env var              | Local fallback                                   |
| --------------------- | -------------------- | ------------------------------------------------ |
| `search`              | `MCP_SEARCH_URL`     | derives suggested search angles from keywords    |
| `pdf`                 | `MCP_PDF_URL`        | reports indexed-doc statistics                   |
| `statistics`          | `MCP_STATS_URL`      | local word / number / reading-time analysis      |
| `government_dataset`  | `MCP_GOV_DATA_URL`   | curated Indian dataset hints (RBI, MOSPI, etc.)  |
| `news`                | `MCP_NEWS_URL`       | falls back to NewsAPI if `NEWS_API_KEY` is set   |
| `visualization`       | `MCP_VIZ_URL`        | timeline chart schema for the future simulator   |

---

## Resume bullets you can copy

- Built **GovSim AI**, a multi-agent system (FastAPI + Next.js) that evaluates Indian public policies across economic, social, legal, environmental, political, and historical dimensions.
- Designed a RAG ingestion pipeline (chunking + OpenAI embeddings) backed by a persistent **Qdrant** vector DB, with retrieval feeding 8 parallel specialised agents.
- Implemented **MCP tool adapters** (search, PDF, statistics, gov dataset, news, visualization) and a session memory layer so agents adapt across runs.
- Added a **Policy Battle Mode** that stages multi-round debates between two policies and a **Future Simulator** projecting GDP, startup, inflation, and employment deltas.

---

## License

MIT.
