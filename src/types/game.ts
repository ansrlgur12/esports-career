export type Position = "TOP" | "JUNGLE" | "MID" | "BOT" | "SUPPORT";
export type TimeSlot = "MORNING" | "AFTERNOON" | "EVENING";

export type Weekday = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";

export type DayType = "TRAINING" | "EVALUATION" | "ACADEMY_MATCH" | "REST";

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

export interface TraineeEvaluationRecord {
  date: string;
  grade: ScrimGrade;
  performanceScore: number;
  win: boolean;
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
  seasonStats: SeasonStats;
  evaluationHistory: TraineeEvaluationRecord[];
  academyPromotionReady: boolean;
}

export interface GameState {
  version: 6;
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
