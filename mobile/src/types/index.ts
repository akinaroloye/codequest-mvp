export type ChallengeType =
  | 'syntax_completion'
  | 'debugging'
  | 'output_prediction'
  | 'performance_tradeoff'
  | 'trace_execution';

export type Difficulty = 'rookie' | 'junior' | 'mid' | 'senior' | 'staff';

export type SubmissionStatus = 'attempted' | 'completed' | 'skipped' | 'timed_out';

// ─── Domain Models ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  avatarSeed: string;
  xpTotal: number;
  level: number;
  gems: number;
  hearts: number;
  streakCurrent: number;
  streakLongest: number;
  streakLastActivity: string | null;   // ISO date string
  streakShieldsbanked: number;
  preferredLanguage: string;
  timezone: string;
}

export interface Challenge {
  id: string;
  slug: string;
  title: string;
  type: ChallengeType;
  language: string;
  difficulty: Difficulty;
  xpReward: number;
  gemReward: number;
  timeLimitSecs: number;
  tags: string[];
  isDaily: boolean;
  content?: ChallengeContent;
}

// ─── Challenge Content Shapes ─────────────────────────────────────────────────

export interface SyntaxBlank {
  id: number;
  placeholder: string;
  solutions: string[];
}

export interface SyntaxCompletionContent {
  prompt: string;
  codeTemplate: string;  // contains ___ placeholders
  blanks: SyntaxBlank[];
  language: string;
}

export interface DebuggingContent {
  prompt: string;
  buggyCode: string;
  bugHint: string;
  bugCategory: string;
}

export interface MCQOption {
  label: string;
  code?: string;
}

export interface MCQContent {
  code?: string;
  scenario?: string;
  options: string[] | MCQOption[];
  correctIndex: number;   // NOT sent to client; validated server-side
  explanation: string;
}

export interface TraceStep {
  name: string;
  initial: unknown;
}

export interface TraceContent {
  code: string;
  variables: TraceStep[];
  steps: number;
}

export type ChallengeContent =
  | SyntaxCompletionContent
  | DebuggingContent
  | MCQContent
  | TraceContent;

// ─── API Responses ────────────────────────────────────────────────────────────

export interface SubmitResponse {
  correct: boolean;
  score: number;
  xpEarned: number;
  explanation: string;
  hint: string | null;
  streakCurrent: number;
  streakMilestone: number | null;
  xpTotal: number;
  level: number;
}

export interface StreakDay {
  date: string;
  xpEarned: number;
  challengesCompleted: number;
  shieldConsumed: boolean;
}

export interface StreakSummary {
  current: number;
  longest: number;
  shieldsbanked: number;
  lastActivity: string | null;
  recentDays: StreakDay[];
}
