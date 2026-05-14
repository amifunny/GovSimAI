from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

RiskLevel = Literal["Low", "Medium", "High"]
PolicyMode = Literal["single", "battle"]


class Article(BaseModel):
    title: str
    source: str = ""
    url: str = ""


class AgentVerdict(BaseModel):
    agent: str
    stance: str
    summary: str
    score: float = Field(ge=0, le=10)
    confidence: int = Field(ge=0, le=100)
    citations: list[str] = Field(default_factory=list)
    articles: list[Article] = Field(default_factory=list)
    # Battle-mode only: per-policy ratings + which side this agent favoured.
    score_a: float | None = None
    score_b: float | None = None
    rationale_a: str = ""
    rationale_b: str = ""
    winner: Literal["A", "B", "tie"] | None = None


class Scorecard(BaseModel):
    economic_impact: float = Field(ge=0, le=10)
    social_impact: float = Field(ge=0, le=10)
    political_feasibility: float = Field(ge=0, le=10)
    legal_complexity: float = Field(ge=0, le=10)
    environmental_impact: float = Field(ge=0, le=10)
    risk_score: RiskLevel


class FutureSnapshot(BaseModel):
    year: int
    gdp_delta_pct: float
    startup_delta_pct: float
    inflation_delta_pct: float
    employment_delta_pct: float
    note: str


class BattleTurn(BaseModel):
    round: int
    speaker: str
    policy_side: Literal["A", "B", "neutral"]
    message: str


class RagSource(BaseModel):
    title: str
    excerpt: str
    score: float = 0.0


class McpInsight(BaseModel):
    tool: str
    status: Literal["ok", "skipped", "error"]
    summary: str
    data: dict = Field(default_factory=dict)


class BattleVerdict(BaseModel):
    winner: Literal["A", "B", "tie"]
    score_a: float
    score_b: float
    reason: str


class JudgeVerdict(BaseModel):
    persona: Literal["Optimistic", "Pessimistic", "Pragmatic"]
    score_a: float = Field(ge=0, le=10)
    score_b: float = Field(ge=0, le=10)
    winner: Literal["A", "B", "tie"]
    key_argument: str = ""
    reasoning: str = ""


class PolicyAnalysis(BaseModel):
    title: str
    mode: PolicyMode
    agents: list[AgentVerdict]
    scorecard: Scorecard
    # Battle-only: per-policy scorecards (deterministically derived from
    # each domain agent's score_a / score_b).
    scorecard_a: Scorecard | None = None
    scorecard_b: Scorecard | None = None
    future: list[FutureSnapshot]
    # Battle-only: per-policy 5-year projections.
    future_a: list[FutureSnapshot] = Field(default_factory=list)
    future_b: list[FutureSnapshot] = Field(default_factory=list)
    battle: list[BattleTurn] = Field(default_factory=list)
    battle_verdict: BattleVerdict | None = None
    judges: list[JudgeVerdict] = Field(default_factory=list)
    critic_summary: str
    sources: list[RagSource] = Field(default_factory=list)
    mcp_insights: list[McpInsight] = Field(default_factory=list)
    memory_note: str = ""


class CitizenReaction(BaseModel):
    persona: str
    sentiment: Literal["positive", "neutral", "negative"]
    reaction: str
