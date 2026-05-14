export type PolicyMode = 'single' | 'battle';
export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface Article {
  title: string;
  source: string;
  url: string;
}

export interface AgentVerdict {
  agent: string;
  stance: string;
  summary: string;
  score: number;
  confidence: number;
  citations: string[];
  articles: Article[];
  reactions?: { persona: string; sentiment: 'positive' | 'neutral' | 'negative'; reaction: string }[];

  // Battle-only:
  score_a?: number;
  score_b?: number;
  rationale_a?: string;
  rationale_b?: string;
  winner?: 'A' | 'B' | 'tie';
}

export interface Scorecard {
  economic_impact: number;
  social_impact: number;
  political_feasibility: number;
  legal_complexity: number;
  environmental_impact: number;
  risk_score: RiskLevel;
}

export interface FutureSnapshot {
  year: number;
  gdp_delta_pct: number;
  startup_delta_pct: number;
  inflation_delta_pct: number;
  employment_delta_pct: number;
  note: string;
}

export interface BattleTurn {
  round: number;
  speaker: string;
  policy_side: 'A' | 'B' | 'neutral';
  message: string;
}

export interface BattleVerdict {
  winner: 'A' | 'B' | 'tie';
  score_a: number;
  score_b: number;
  reason: string;
}

export interface JudgeVerdict {
  persona: 'Optimistic' | 'Pessimistic' | 'Pragmatic';
  score_a: number;
  score_b: number;
  winner: 'A' | 'B' | 'tie';
  key_argument: string;
  reasoning: string;
}

export interface RagSource {
  title: string;
  excerpt: string;
  score?: number;
}

export interface McpInsight {
  tool: string;
  status: 'ok' | 'skipped' | 'error';
  summary: string;
  data: Record<string, unknown>;
}

export interface PolicyReport {
  id: string;
  createdAt: number;
  title: string;
  mode: PolicyMode;
  policyText: string;
  policyBText: string;
  agents: AgentVerdict[];
  scorecard: Scorecard;
  scorecard_a?: Scorecard | null;
  scorecard_b?: Scorecard | null;
  future: FutureSnapshot[];
  future_a?: FutureSnapshot[];
  future_b?: FutureSnapshot[];
  battle: BattleTurn[];
  battle_verdict?: BattleVerdict | null;
  judges?: JudgeVerdict[];
  critic_summary: string;
  sources: RagSource[];
  mcp_insights: McpInsight[];
  memory_note: string;
}
