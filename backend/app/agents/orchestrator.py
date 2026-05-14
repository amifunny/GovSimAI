"""Multi-agent orchestration.

Strategy:

    1. Build a shared RAG context + MCP-tool blob.
    2. Run all 8 agents in parallel via one GPT call per agent.
       - In single mode the agent returns ONE score for the policy.
       - In battle mode the agent rates BOTH Policy A and Policy B and picks a
         winner from their own domain perspective, plus suggests 2-3 articles
         to read as justification.
    3. A synthesizer aggregates scorecard, critic summary, future timeline,
       and (in battle mode) the overall winner.

If no OpenAI API key is available we return deterministic mock data so the
frontend keeps working in dev / demo.
"""
from __future__ import annotations

import asyncio
import json
from datetime import date
from typing import Any

from openai import AsyncOpenAI

from ..config import REASONING_MODEL
from .personas import AGENTS, AgentPersona, agent_titles

AGENT_ROSTER = agent_titles()


def _future_years(count: int = 5) -> list[int]:
    """Next N years starting from the year after today."""
    y0 = date.today().year + 1
    return [y0 + i for i in range(count)]


def _dedupe_articles_across_agents(agents_payload: list[dict[str, Any]]) -> None:
    """Mutates agents_payload so the same article title never appears twice
    across the whole panel. Keeps the first agent that mentioned each article
    and drops it from later agents.
    """
    seen: set[str] = set()
    for a in agents_payload:
        articles = a.get("articles") or []
        kept: list[dict[str, Any]] = []
        for art in articles:
            if not isinstance(art, dict):
                continue
            key = (art.get("title") or "").strip().lower()
            if not key or key in seen:
                continue
            seen.add(key)
            kept.append(art)
        a["articles"] = kept


def _render_context(sources: list[dict[str, Any]]) -> str:
    if not sources:
        return "No retrieved context available."
    rows = []
    for i, s in enumerate(sources, 1):
        title = s.get("title", "context")
        excerpt = s.get("excerpt", "")
        rows.append(f"[{i}] {title}\n{excerpt}")
    return "\n\n".join(rows)


def _render_mcp(insights: list[dict[str, Any]]) -> str:
    if not insights:
        return "No MCP outputs."
    rows = []
    for ins in insights:
        data_str = json.dumps(ins.get("data", {}))[:600]
        rows.append(
            f"- {ins['tool']} ({ins['status']}): {ins['summary']}\n  data: {data_str}"
        )
    return "\n".join(rows)


def _mock_agents(policy: str, battle: bool) -> list[dict[str, Any]]:
    out = []
    for a in AGENTS:
        entry: dict[str, Any] = {
            "agent": a["title"],
            "stance": "Mixed",
            "summary": (
                f"{a['name']} would normally analyse '{policy[:60]}...' but no "
                "OpenAI key is configured. This is a placeholder."
            ),
            "score": 5.0,
            "confidence": 40,
            "citations": [],
            "articles": [],
        }
        if battle:
            entry.update(
                {
                    "score_a": 5.0,
                    "score_b": 5.0,
                    "rationale_a": "Demo rationale for A.",
                    "rationale_b": "Demo rationale for B.",
                    "winner": "tie",
                }
            )
        out.append(entry)
    return out


def _mock_future_for(years: list[int]) -> list[dict[str, Any]]:
    out = []
    for i, y in enumerate(years):
        out.append({
            "year": y,
            "gdp_delta_pct": round(0.4 + 0.15 * i, 1),
            "startup_delta_pct": round(1.5 + 0.4 * i, 1),
            "inflation_delta_pct": round(0.3 + 0.1 * i, 1),
            "employment_delta_pct": round(0.2 + 0.1 * i, 1),
            "note": "Demo projection — add an OpenAI key for real forecasts.",
        })
    return out


def _mock_synthesis() -> dict[str, Any]:
    years = _future_years(5)
    return {
        "scorecard": {
            "economic_impact": 5,
            "social_impact": 5,
            "political_feasibility": 5,
            "legal_complexity": 5,
            "environmental_impact": 5,
            "risk_score": "Medium",
        },
        "future": _mock_future_for(years),
        "critic_summary": "Demo mode: add an OpenAI API key to get a real multi-agent verdict.",
    }


def _agent_schema(persona: AgentPersona, battle: bool) -> str:
    citizen_reactions = (
        '"reactions": [ '
        '{"persona": "Students", "sentiment": "positive|neutral|negative", "reaction": "..."}, '
        '{"persona": "Middle class", ...}, {"persona": "Businesses", ...}, '
        '{"persona": "Rural communities", ...}, {"persona": "Startups", ...} ]'
    )

    if battle:
        base = (
            '{"agent": "<your title>", "stance": "Supportive|Skeptical|Mixed|Opposed", '
            '"summary": "<2-3 sharp sentences comparing both policies in your domain>", '
            '"score": <0-10 float, OVERALL view treating both policies as one question>, '
            '"score_a": <0-10 float, Policy A only>, "score_b": <0-10 float, Policy B only>, '
            '"rationale_a": "<one sentence on why Policy A scored what it scored>", '
            '"rationale_b": "<one sentence on why Policy B scored what it scored>", '
            '"winner": "A" | "B" | "tie", '
            '"confidence": <0-100 int>, '
            '"citations": ["short note tying to a context [n] or known law/article", ...], '
            '"articles": [ {"title": "Article title", "source": "Publication", "url": "https://..."} ]'
        )
        if persona["key"] == "citizen":
            base += ", " + citizen_reactions
        return base + " }"

    base = (
        '{"agent": "<your title>", "stance": "Supportive|Skeptical|Mixed|Opposed", '
        '"summary": "<2-3 sharp sentences, India-specific>", '
        '"score": <0-10 float>, "confidence": <0-100 int>, '
        '"citations": ["short note", ...], '
        '"articles": [ {"title": "Article title", "source": "Publication", "url": "https://..."} ]'
    )
    if persona["key"] == "citizen":
        base += ", " + citizen_reactions
    return base + " }"


async def _run_one_agent(
    client: AsyncOpenAI,
    persona: AgentPersona,
    policy_a: str,
    policy_b: str,
    mode: str,
    context_blob: str,
    mcp_blob: str,
    memory_note: str,
) -> dict[str, Any]:
    is_battle = mode == "battle" and bool(policy_b)
    schema_hint = _agent_schema(persona, is_battle)

    if is_battle:
        focus_block = (
            "This is a BATTLE between two policies. Rate BOTH separately on a 0-10 "
            "scale from your domain's perspective, then pick a winner from your "
            "domain (A, B, or tie).\n"
            f"Policy A: {policy_a}\n"
            f"Policy B: {policy_b}"
        )
    else:
        focus_block = "Policy under review:\n" + policy_a

    domain_hint = {
        "economist": "macro economics, GDP, jobs, RBI / MoF bulletins, IMF, World Bank, fiscal reports",
        "social": "education, demographics, inequality, NSS / NFHS data, UNICEF, Pratham",
        "political": "Lok Sabha debates, Parliamentary committee reports, federal politics, election commission",
        "legal": "Supreme Court judgments, Indian Kanoon, constitutional law analyses, Bar & Bench, LiveLaw",
        "environmental": "CPCB, MoEF, IPCC, CSE, climate journals, IEA, biodiversity reports",
        "historian": "EPW historical essays, Indian Economic & Social History Review, archival reports",
        "critic": "expert opinion pieces, post-mortems of past Indian policies, Brookings, IDFC Institute",
        "citizen": "ground reportages, The Wire, Scroll.in, Down to Earth, citizen-perspective op-eds",
    }.get(persona["key"], "credible Indian and global publications")

    user_msg = f"""
You are {persona['name']} acting as the {persona['title']} for an Indian
public-policy think tank.

{persona['bio']}

{focus_block}

Long-term session memory note (adapt your tone slightly):
{memory_note}

Retrieved context (RAG):
{context_blob}

MCP tool outputs:
{mcp_blob}

Return a single JSON object with this exact shape:
{schema_hint}

Constraints:
- Be India-specific. Mention real ministries, states, or laws where relevant.
- score = your domain's overall verdict.
- citations should be short labels, e.g. "[1] World Bank framing" or "Article 21".
- For "articles", suggest 2-3 articles that ONLY a {persona['title']} would cite
  -- i.e. they must be SPECIFIC to your domain ({domain_hint}). Do NOT suggest
  generic articles that another domain agent would also pick. Pick distinct,
  domain-flavoured pieces.
- Use credible publications. If a real URL is uncertain, set "url" to the
  publication root, e.g. "https://www.thehindu.com" -- never fabricate a precise
  URL you do not know.
""".strip()

    try:
        completion = await client.chat.completions.create(
            model=REASONING_MODEL,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a careful Indian public-policy analyst. Be honest about uncertainty."},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.4,
        )
        raw = completion.choices[0].message.content or "{}"
        data = json.loads(raw)
    except Exception as e:
        data = {
            "agent": persona["title"],
            "stance": "Unknown",
            "summary": f"Agent run failed: {e}",
            "score": 5.0,
            "confidence": 30,
            "citations": [],
            "articles": [],
        }

    data["agent"] = persona["title"]
    if not isinstance(data.get("articles"), list):
        data["articles"] = []
    # Normalize article shape.
    cleaned: list[dict[str, str]] = []
    for art in data.get("articles", [])[:4]:
        if not isinstance(art, dict):
            continue
        cleaned.append(
            {
                "title": str(art.get("title", ""))[:140],
                "source": str(art.get("source", ""))[:60],
                "url": str(art.get("url", ""))[:300],
            }
        )
    data["articles"] = cleaned

    if persona["key"] == "citizen" and isinstance(data.get("reactions"), list):
        data["reactions"] = data["reactions"][:5]

    if is_battle:
        # Make sure battle fields exist.
        data.setdefault("score_a", float(data.get("score", 5.0)))
        data.setdefault("score_b", float(data.get("score", 5.0)))
        data.setdefault("rationale_a", "")
        data.setdefault("rationale_b", "")
        winner = str(data.get("winner", "")).upper()
        if winner not in ("A", "B", "TIE"):
            sa = float(data.get("score_a") or 0)
            sb = float(data.get("score_b") or 0)
            winner = "A" if sa > sb else ("B" if sb > sa else "TIE")
        data["winner"] = "tie" if winner == "TIE" else winner
    return data


async def _synthesize(
    client: AsyncOpenAI,
    policy_a: str,
    policy_b: str,
    mode: str,
    agents_payload: list[dict[str, Any]],
) -> dict[str, Any]:
    years = _future_years(5)
    years_str = ", ".join(str(y) for y in years)
    user_msg = f"""
You are the GovSim AI synthesizer. Aggregate these 8 agent verdicts into a
final scorecard, critic summary, and a 5-year future projection covering the
years {years_str} (yearly deltas vs current baseline, plausible signed numbers
within +/- 8.0%).

Policy A: {policy_a}
Policy B (battle only): {policy_b or 'N/A'}
Mode: {mode}

Agent verdicts:
{json.dumps(agents_payload)[:6000]}

Return JSON exactly like:
{{
  "scorecard": {{
    "economic_impact": <0-10>,
    "social_impact": <0-10>,
    "political_feasibility": <0-10>,
    "legal_complexity": <0-10>,
    "environmental_impact": <0-10>,
    "risk_score": "Low" | "Medium" | "High"
  }},
  "future": [
    {{ "year": {years[0]}, "gdp_delta_pct": <number>, "startup_delta_pct": <number>, "inflation_delta_pct": <number>, "employment_delta_pct": <number>, "note": "..." }},
    ... one object per year for {years_str} ...
  ],
  "critic_summary": "<2-3 sharp sentences naming the biggest risk or weak assumption>"
}}
""".strip()
    try:
        completion = await client.chat.completions.create(
            model=REASONING_MODEL,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "Synthesize multi-agent analysis into clean structured JSON."},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.3,
        )
        return json.loads(completion.choices[0].message.content or "{}")
    except Exception:
        return _mock_synthesis()


def _clamp(value: float, lo: float = 0.0, hi: float = 10.0) -> float:
    return max(lo, min(hi, value))


def _agent_score(agents: list[dict[str, Any]], title: str, side: str) -> float | None:
    """Pick a specific agent's per-policy score (side='a'|'b'). Returns None if missing."""
    key = f"score_{side}"
    for a in agents:
        if a.get("agent") == title and a.get(key) is not None:
            try:
                return float(a[key])
            except (TypeError, ValueError):
                return None
    return None


def _risk_from_composite(composite: float) -> str:
    if composite >= 7.0:
        return "Low"
    if composite >= 5.0:
        return "Medium"
    return "High"


def _compute_per_policy_scorecards(
    agents_payload: list[dict[str, Any]],
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    """Deterministically map each domain agent's per-policy score to the 5-dimension scorecard.

    Mapping:
        Economist Agent     -> economic_impact
        Social Agent        -> social_impact
        Political Agent     -> political_feasibility
        Legal Agent         -> legal_complexity   (INVERTED: 10 - score, since
                                                   the agent's score is "legal fit"
                                                   but the scorecard tracks "complexity")
        Environmental Agent -> environmental_impact

    Other agents (Historian, Critic, Citizen) are cross-cutting and inform the
    blended scorecard / future timeline / critic summary, not the per-policy
    five-dimension grid.
    """
    def build_one(side: str) -> dict[str, Any] | None:
        econ = _agent_score(agents_payload, "Economist Agent", side)
        soc  = _agent_score(agents_payload, "Social Agent", side)
        pol  = _agent_score(agents_payload, "Political Agent", side)
        leg  = _agent_score(agents_payload, "Legal Agent", side)
        env  = _agent_score(agents_payload, "Environmental Agent", side)
        if any(v is None for v in (econ, soc, pol, leg, env)):
            return None
        economic_impact      = _clamp(econ)         # type: ignore[arg-type]
        social_impact        = _clamp(soc)          # type: ignore[arg-type]
        political_feas       = _clamp(pol)          # type: ignore[arg-type]
        legal_complexity     = _clamp(10.0 - leg)   # type: ignore[operator]
        environmental_impact = _clamp(env)          # type: ignore[arg-type]
        composite = (
            economic_impact
            + social_impact
            + political_feas
            + (10.0 - legal_complexity)
            + environmental_impact
        ) / 5.0
        return {
            "economic_impact": round(economic_impact, 1),
            "social_impact": round(social_impact, 1),
            "political_feasibility": round(political_feas, 1),
            "legal_complexity": round(legal_complexity, 1),
            "environmental_impact": round(environmental_impact, 1),
            "risk_score": _risk_from_composite(composite),
        }

    return build_one("a"), build_one("b")


def _compute_battle_verdict(agents_payload: list[dict[str, Any]]) -> dict[str, Any]:
    """Aggregate per-agent A/B scores into a single battle verdict."""
    if not agents_payload:
        return {"winner": "tie", "score_a": 5.0, "score_b": 5.0, "reason": "No agents ran."}
    a_scores = [float(a.get("score_a") or 0.0) for a in agents_payload if a.get("score_a") is not None]
    b_scores = [float(a.get("score_b") or 0.0) for a in agents_payload if a.get("score_b") is not None]
    if not a_scores or not b_scores:
        return {"winner": "tie", "score_a": 5.0, "score_b": 5.0, "reason": "Missing per-policy scores."}
    avg_a = sum(a_scores) / len(a_scores)
    avg_b = sum(b_scores) / len(b_scores)
    votes_a = sum(1 for a in agents_payload if str(a.get("winner", "")).upper() == "A")
    votes_b = sum(1 for a in agents_payload if str(a.get("winner", "")).upper() == "B")
    if abs(avg_a - avg_b) < 0.25 and votes_a == votes_b:
        winner = "tie"
    elif avg_a > avg_b:
        winner = "A"
    else:
        winner = "B"
    reason = (
        f"Average agent rating: Policy A {avg_a:.1f}/10 vs Policy B {avg_b:.1f}/10. "
        f"Agent votes: A={votes_a}, B={votes_b}, tie={len(agents_payload) - votes_a - votes_b}."
    )
    return {
        "winner": winner,
        "score_a": round(avg_a, 1),
        "score_b": round(avg_b, 1),
        "reason": reason,
    }


async def run_analysis(
    policy_text: str,
    policy_b_text: str,
    mode: str,
    memory_note: str,
    sources: list[dict[str, Any]],
    mcp_insights: list[dict[str, Any]],
    api_key: str | None,
) -> dict[str, Any]:
    """Run all agents + synthesizer. Returns dict matching schemas.PolicyAnalysis."""
    title = (policy_text.strip().splitlines() or ["Untitled policy"])[0][:90]
    is_battle = mode == "battle" and bool(policy_b_text)

    if not api_key:
        agents = _mock_agents(policy_text, is_battle)
        synth = _mock_synthesis()
        verdict = _compute_battle_verdict(agents) if is_battle else None
        scorecard_a, scorecard_b = (
            _compute_per_policy_scorecards(agents) if is_battle else (None, None)
        )
        years = _future_years(5)
        return {
            "title": title,
            "mode": mode,
            "agents": agents,
            "scorecard": synth["scorecard"],
            "scorecard_a": scorecard_a,
            "scorecard_b": scorecard_b,
            "future": synth["future"],
            "future_a": _mock_future_for(years) if is_battle else [],
            "future_b": _mock_future_for(years) if is_battle else [],
            "battle": [],
            "battle_verdict": verdict,
            "judges": [],
            "critic_summary": synth["critic_summary"],
            "sources": sources,
            "mcp_insights": mcp_insights,
            "memory_note": memory_note,
        }

    client = AsyncOpenAI(api_key=api_key)
    context_blob = _render_context(sources)
    mcp_blob = _render_mcp(mcp_insights)

    agent_tasks = [
        _run_one_agent(
            client,
            persona=p,
            policy_a=policy_text,
            policy_b=policy_b_text,
            mode=mode,
            context_blob=context_blob,
            mcp_blob=mcp_blob,
            memory_note=memory_note,
        )
        for p in AGENTS
    ]
    agents_payload = await asyncio.gather(*agent_tasks)
    _dedupe_articles_across_agents(agents_payload)

    synth = await _synthesize(client, policy_text, policy_b_text, mode, agents_payload)
    if "scorecard" not in synth:
        synth = _mock_synthesis()

    battle: list[dict[str, Any]] = []
    verdict = None
    scorecard_a = None
    scorecard_b = None
    judges: list[dict[str, Any]] = []
    future_a: list[dict[str, Any]] = []
    future_b: list[dict[str, Any]] = []

    if is_battle:
        scorecard_a, scorecard_b = _compute_per_policy_scorecards(agents_payload)
        # Round 2 (live debate) + per-policy 5-year projections in parallel.
        battle, future_a, future_b = await asyncio.gather(
            run_battle(
                policy_a=policy_text,
                policy_b=policy_b_text,
                sources=sources,
                api_key=api_key,
                rounds=3,
            ),
            run_future_simulator(policy_text, sources, api_key, label="Policy A"),
            run_future_simulator(policy_b_text, sources, api_key, label="Policy B"),
        )
        # Round 3: three judges deliberate over Rounds 1 + 2 and crown the winner.
        judges = await run_judges(
            client=client,
            policy_a=policy_text,
            policy_b=policy_b_text,
            agents_payload=agents_payload,
            battle_turns=battle,
            scorecard_a=scorecard_a,
            scorecard_b=scorecard_b,
        )
        verdict = _verdict_from_judges(judges) or _compute_battle_verdict(agents_payload)

    return {
        "title": title,
        "mode": mode,
        "agents": agents_payload,
        "scorecard": synth.get("scorecard"),
        "scorecard_a": scorecard_a,
        "scorecard_b": scorecard_b,
        "future": synth.get("future") or _mock_synthesis()["future"],
        "future_a": future_a,
        "future_b": future_b,
        "battle": battle,
        "battle_verdict": verdict,
        "judges": judges,
        "critic_summary": synth.get("critic_summary", ""),
        "sources": sources,
        "mcp_insights": mcp_insights,
        "memory_note": memory_note,
    }


async def run_battle(
    policy_a: str,
    policy_b: str,
    sources: list[dict[str, Any]],
    api_key: str | None,
    rounds: int = 3,
) -> list[dict[str, Any]]:
    if not api_key:
        return [
            {"round": 1, "speaker": "Economist Agent", "policy_side": "A", "message": "Demo battle. Add an API key for a real debate."},
            {"round": 1, "speaker": "Economist Agent", "policy_side": "B", "message": "Rebuttal placeholder."},
        ]
    client = AsyncOpenAI(api_key=api_key)
    context_blob = _render_context(sources)
    user_msg = f"""
Stage a structured 3-sub-round live debate (Round 2 of the battle) between two
Indian policies. Each sub-round has a distinct purpose:

  Sub-round 1 — Opening arguments: each side presents its strongest case.
  Sub-round 2 — Rebuttals: each side attacks the other's weakest claim.
  Sub-round 3 — Closing: each side delivers a final pitch.

Policy A: {policy_a}
Policy B: {policy_b}

Context:
{context_blob}

Return JSON:
{{ "turns": [ {{ "round": 1, "speaker": "Economist Agent", "policy_side": "A", "message": "..." }}, ... ] }}

Rules:
- Use speakers from this roster: Economist Agent, Social Agent, Political Agent, Legal Agent, Environmental Agent, Historian Agent, Critic Agent, Citizen Agent.
- 6-9 turns total across the 3 sub-rounds, alternating Policy A / Policy B.
- Keep each message under 60 words and India-specific.
- Different speakers in each sub-round (don't repeat the same speaker on the same side twice).
""".strip()
    try:
        completion = await client.chat.completions.create(
            model=REASONING_MODEL,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "Stage a sharp, civil multi-agent policy debate."},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.6,
        )
        data = json.loads(completion.choices[0].message.content or "{}")
        return list(data.get("turns") or [])
    except Exception:
        return []


async def run_future_simulator(
    policy_text: str,
    sources: list[dict[str, Any]],
    api_key: str | None,
    label: str = "this policy",
) -> list[dict[str, Any]]:
    """Produce a 5-year future timeline for a single policy."""
    years = _future_years(5)
    if not api_key:
        return _mock_future_for(years)
    client = AsyncOpenAI(api_key=api_key)
    years_str = ", ".join(str(y) for y in years)
    user_msg = f"""
Project plausible directional outcomes for {label} (an Indian policy) for each
of the next 5 years: {years_str}. Use small numbers (typically +/- 5%) and label
one short note per year. JSON only:
{{ "future": [ {{ "year": {years[0]}, "gdp_delta_pct": <n>, "startup_delta_pct": <n>, "inflation_delta_pct": <n>, "employment_delta_pct": <n>, "note": "..." }}, ... ] }}

Policy:
{policy_text}

Context:
{_render_context(sources)}
""".strip()
    try:
        completion = await client.chat.completions.create(
            model=REASONING_MODEL,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "Be a careful policy forecaster."},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.4,
        )
        data = json.loads(completion.choices[0].message.content or "{}")
        return list(data.get("future") or _mock_future_for(years))
    except Exception:
        return _mock_future_for(years)


async def run_judges(
    client: AsyncOpenAI,
    policy_a: str,
    policy_b: str,
    agents_payload: list[dict[str, Any]],
    battle_turns: list[dict[str, Any]],
    scorecard_a: dict[str, Any] | None,
    scorecard_b: dict[str, Any] | None,
) -> list[dict[str, Any]]:
    """Round 3 of battle mode: three judges with distinct philosophies score the
    debate and crown a winner."""
    transcript_str = "\n".join(
        f"R{t.get('round','?')} · {t.get('speaker','?')} · Policy {t.get('policy_side','?')}: {t.get('message','')[:300]}"
        for t in battle_turns
    ) or "No transcript available."
    user_msg = f"""
You are a 3-judge panel evaluating an Indian policy debate. Each judge has a
distinct philosophy:

1. The Optimistic Judge — weighs upside potential, growth, equity gains and
   innovation. Discounts worst-case implementation risk.
2. The Pessimistic Judge — weighs downsides, fiscal risk, implementation
   failure, and unintended consequences. Discounts best-case promises.
3. The Pragmatic Judge — weighs feasibility, sequencing, marginal cost-benefit,
   political realism, and execution capacity in India.

Each judge MUST score BOTH policies independently and pick a winner.

Policy A: {policy_a}
Policy B: {policy_b}

Per-policy 5-dimension scorecards from the 8 domain agents:
A: {json.dumps(scorecard_a) if scorecard_a else 'N/A'}
B: {json.dumps(scorecard_b) if scorecard_b else 'N/A'}

Live debate transcript (Round 2):
{transcript_str[:3000]}

Return JSON exactly like:
{{
  "judges": [
    {{
      "persona": "Optimistic",
      "score_a": <0-10>,
      "score_b": <0-10>,
      "winner": "A" | "B" | "tie",
      "key_argument": "<one sentence: the single argument that swung your vote>",
      "reasoning": "<2-3 sentences explaining your verdict from your philosophy>"
    }},
    {{ "persona": "Pessimistic", ... }},
    {{ "persona": "Pragmatic",   ... }}
  ]
}}
""".strip()
    try:
        completion = await client.chat.completions.create(
            model=REASONING_MODEL,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are three Indian policy judges deliberating in clean structured JSON."},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.5,
        )
        data = json.loads(completion.choices[0].message.content or "{}")
        raw = list(data.get("judges") or [])
        cleaned: list[dict[str, Any]] = []
        for j in raw:
            if not isinstance(j, dict):
                continue
            persona = str(j.get("persona", "")).strip().capitalize()
            if persona not in ("Optimistic", "Pessimistic", "Pragmatic"):
                continue
            winner = str(j.get("winner", "")).upper()
            if winner not in ("A", "B", "TIE"):
                sa = float(j.get("score_a") or 0)
                sb = float(j.get("score_b") or 0)
                winner = "A" if sa > sb else ("B" if sb > sa else "TIE")
            cleaned.append({
                "persona": persona,
                "score_a": float(j.get("score_a") or 0),
                "score_b": float(j.get("score_b") or 0),
                "winner": "tie" if winner == "TIE" else winner,
                "key_argument": str(j.get("key_argument", ""))[:240],
                "reasoning": str(j.get("reasoning", ""))[:600],
            })
        return cleaned
    except Exception:
        return []


def _verdict_from_judges(judges: list[dict[str, Any]]) -> dict[str, Any] | None:
    """Crown a winner from the 3-judge panel: majority vote, ties broken by
    larger average score gap."""
    if not judges:
        return None
    votes = {"A": 0, "B": 0, "tie": 0}
    for j in judges:
        votes[j.get("winner", "tie")] += 1
    avg_a = sum(float(j.get("score_a") or 0) for j in judges) / len(judges)
    avg_b = sum(float(j.get("score_b") or 0) for j in judges) / len(judges)
    if votes["A"] > votes["B"]:
        winner = "A"
    elif votes["B"] > votes["A"]:
        winner = "B"
    else:
        winner = "A" if avg_a > avg_b else ("B" if avg_b > avg_a else "tie")
    reason = (
        f"Judges voted A={votes['A']}, B={votes['B']}, tie={votes['tie']}. "
        f"Average judge score: A {avg_a:.1f}/10 vs B {avg_b:.1f}/10."
    )
    return {
        "winner": winner,
        "score_a": round(avg_a, 1),
        "score_b": round(avg_b, 1),
        "reason": reason,
    }
