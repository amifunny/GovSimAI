# GovSim AI · Frontend (Next.js 15)

App Router + TypeScript + Tailwind v4. All OpenAI calls happen via the FastAPI backend; the browser provides a user-owned API key (BYOK).

## Run locally

```bash
npm install
cp .env.example .env.local       # NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
npm run dev
```

Open <http://localhost:3000>.

## Pages

- `/` — landing
- `/lab` — single-policy multi-agent simulation
- `/battle` — policy battle mode
- `/history` — local list of past simulations
- `/report/[id]` — detailed scorecard + agent cards + future timeline + MCP outputs + RAG sources

## State

- BYOK key: stored in `localStorage` (`govsim.openai_api_key`)
- Session id: `localStorage` (`govsim.session_id`)
- Reports: `localStorage` (`govsim.reports.v1`)

No backend storage, no signup.
