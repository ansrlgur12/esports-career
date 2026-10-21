export type Position = "TOP" | "JUNGLE" | "MID" | "BOT" | "SUPPORT";
export type TimeSlot = "MORNING" | "AFTERNOON" | "EVENING";

export type Weekday = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";

export type DayType =
  | "TRAINING"
  | "EVALUATION"
  | "SCRIM"
  | "ACADEMY_MATCH"
  | "REST";

export type StatKey =
  | "physical"
  | "reaction"
  | "accuracy"
  | "movement"
  | "focus"
  | "laning"
  | "cs"
  | "killSense"
  | "survival"
  | "champPool"
  | "macro"
  | "vision"
  | "decision"
  | "objective"
  | "teamfight"
  | "calling"
  | "synergy"
  | "mental";

export type Stats = Record<StatKey, number>;
export type StatXp = Record<StatKey, number>;

export interface AvatarState {
  face: number;
  eyes: number;
  noseMouth: number;
  hair: number;
  accessory: number;
}

export interface RecoveryState {
  dateKey: string;
  used: number;
}

export interface SeasonStats {
  games: number;
  kills: number;
  deaths: number;
  assists: number;
}

export interface AcademyMatchRecord {
  round: number;
  date: string;
  opponentId: string;
  opponentName: string;
  opponentPower: number;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  performanceScore: number;
}

export interface AcademySeasonState {
  round: number;
  wins: number;
  losses: number;
  teamRank: number;
  teamPower: number;
  firstTeamInterest: number;
  matchHistory: AcademyMatchRecord[];
}

export interface TraineeEvaluationRecord {
  date: string;
  grade: ScrimGrade;
  performanceScore: number;
  win: boolean;
  matchScore?: number;
  scrimScore?: number;
  ovrScore?: number;
  readinessScore?: number;
  rankBefore?: number;
  rankAfter?: number;
  positionRankBefore?: number;
  positionRankAfter?: number;
  rivalName?: string;
  rivalScore?: number;
  rivalryMessage?: string;
  coachTrustBefore?: number;
  coachTrustAfter?: number;
  promotionChanceBefore?: string;
  promotionChanceAfter?: string;
}

export interface TraineeScrimRecord {
  date: string;
  grade: ScrimGrade;
  performanceScore: number;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
}

export type TraineeRivalStyle =
  | "PRODIGY"
  | "STEADY"
  | "SWINGY"
  | "WORKHORSE"
  | "SMART";

export interface TraineeRival {
  id: string;
  name: string;
  position: Position;
  age: number;
  ovr: number;
  potential: number;
  form: number;
  coachRating: number;
  scrimRating: number;
  evaluationScore: number;
  lastEvaluationGrade: ScrimGrade | null;
  trend: -1 | 0 | 1;
  style: TraineeRivalStyle;
}

export interface AcademyCallupCandidate {
  id: string;
  name: string;
  position: Position;
  score: number;
  positionRank: number;
  isPlayer: boolean;
  reason: string;
}

export interface PlayerState {
  name: string;
  position: Position;
  age: number;
  careerStage: "TRAINEE" | "ACADEMY";
  avatar: AvatarState;
  stats: Stats;
  xp: StatXp;
  stamina: number;
  condition: number;
  stress: number;
  coachTrust: number;
  starterCompetition: number;
  annualSalary: number;
  morningEventCompletedDate: string | null;
  seasonStats: SeasonStats;
  academySeason: AcademySeasonState;
  evaluationHistory: TraineeEvaluationRecord[];
  traineeScrimHistory: TraineeScrimRecord[];
  traineeRivals: TraineeRival[];
  academyPromotionReady: boolean;
}

export interface GameState {
  version: 7;
  date: string;
  slot: TimeSlot;
  player: PlayerState;
  actionSeed: number;
  recovery: RecoveryState;
}

export interface ActionDef {
  id: string;
  name: string;
  icon?: string;
  xp: Partial<Record<StatKey, number>>;
  stamina: number;
  condition: number;
  stress: number;
  tags: string[];
  weight: number;
}

export type ScrimGrade = "S" | "A+" | "A" | "B+" | "B" | "C";

export interface ScrimResult {
  win: boolean;
  playerKills: number;
  playerDeaths: number;
  playerAssists: number;
  teamKills: number;
  enemyKills: number;
  goldDiff: number;
  clutchSuccesses: number;
  clutchTotal: number;
  performanceScore: number;
  grade: ScrimGrade;
  coachTrustDelta: number;
  starterCompetitionDelta: number;
  strengths: string[];
  improvements: string[];
  coachComment: string;
}
