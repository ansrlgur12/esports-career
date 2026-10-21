export type Position = "TOP" | "JUNGLE" | "MID" | "BOT" | "SUPPORT";
export type TimeSlot = "MORNING" | "AFTERNOON" | "EVENING";

export type Weekday = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";

export type DayType =
  | "TRAINING"
  | "EVALUATION"
  | "SCRIM"
  | "SECOND_TEAM_MATCH"
  | "FIRST_TEAM_MATCH"
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

export interface SecondTeamStarterSeriesStats {
  sets: number;
  kills: number;
  deaths: number;
  assists: number;
  performanceScore: number;
}

export interface SecondTeamMatchRecord {
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
  playerParticipated?: boolean;
  starterStats?: SecondTeamStarterSeriesStats;
}

export type SecondTeamLeagueTeamId =
  | "VORTEX"
  | "NOVA"
  | "RAVEN"
  | "APEX"
  | "ZERO"
  | "ORBIT"
  | "TITAN"
  | "PULSE"
  | "ECLIPSE"
  | "PHANTOM";

export type SecondTeamPlayerArchetype =
  | "CARRY"
  | "ROAMER"
  | "CONTROL"
  | "AGGRESSIVE"
  | "STABLE"
  | "SHOTCALLER"
  | "DEVELOPMENT";

export interface SecondTeamLeaguePlayer {
  id: string;
  name: string;
  team: SecondTeamLeagueTeamId;
  position: Position;
  age: number;
  ovr: number;
  potential: number;
  form: number;
  morale: number;
  stamina: number;
  synergy: number;
  coachTrust: number;
  archetype: SecondTeamPlayerArchetype;
  starter: boolean;
  seasonXp: number;
  hotStreak: number;
  coldStreak: number;
  games: number;
  sets: number;
  kills: number;
  deaths: number;
  assists: number;
  performanceTotal: number;
  lastPerformance: number;
}

export interface SecondTeamLeagueTeam {
  id: SecondTeamLeagueTeamId;
  name: string;
  basePower: number;
  synergy: number;
  form: number;
  roster: SecondTeamLeaguePlayer[];
}

export interface SecondTeamLeagueMatchResult {
  round: number;
  teamA: SecondTeamLeagueTeamId;
  teamB: SecondTeamLeagueTeamId;
  winner: SecondTeamLeagueTeamId;
  teamASets: number;
  teamBSets: number;
}

export type SecondTeamPlayoffStage =
  | "WILDCARD"
  | "ROUND1"
  | "ROUND2"
  | "FINAL"
  | "COMPLETE";

export interface SecondTeamTiebreakerResult {
  teams: SecondTeamLeagueTeamId[];
  winner: SecondTeamLeagueTeamId;
  loser: SecondTeamLeagueTeamId;
  reason: "TIEBREAKER";
}

export interface SecondTeamPlayoffSeries {
  stage: Exclude<SecondTeamPlayoffStage, "COMPLETE">;
  teamA: SecondTeamLeagueTeamId;
  teamB: SecondTeamLeagueTeamId;
  bestOf: 3 | 5;
  teamAWins: number;
  teamBWins: number;
  winner?: SecondTeamLeagueTeamId;
}

export interface SecondTeamPlayoffState {
  qualifiedTeams: SecondTeamLeagueTeamId[];
  seedOrder: SecondTeamLeagueTeamId[];
  tiebreakers: SecondTeamTiebreakerResult[];
  currentStage: SecondTeamPlayoffStage;
  series: SecondTeamPlayoffSeries[];
  champion?: SecondTeamLeagueTeamId;
  vortexQualified: boolean;
  vortexEliminated: boolean;
}

export interface SecondTeamLeagueState {
  results: SecondTeamLeagueMatchResult[];
  teams: SecondTeamLeagueTeam[];
  playoffs?: SecondTeamPlayoffState;
}

export type SplitName = "SPRING" | "SUMMER";
export type SplitPhase = "REGULAR" | "PLAYOFFS" | "OFFSEASON";

export interface SecondTeamSeasonState {
  year?: number;
  split?: SplitName;
  phase?: SplitPhase;
  round: number;
  wins: number;
  losses: number;
  setWins?: number;
  setLosses?: number;
  teamRank: number;
  teamPower: number;
  firstTeamInterest: number;
  matchHistory: SecondTeamMatchRecord[];
  leagueState?: SecondTeamLeagueState;
}

export interface AcademyEvaluationRecord {
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

export interface AcademyScrimRecord {
  date: string;
  grade: ScrimGrade;
  performanceScore: number;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
}

export type AcademyRivalStyle =
  | "PRODIGY"
  | "STEADY"
  | "SWINGY"
  | "WORKHORSE"
  | "SMART";

export interface AcademyRival {
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
  style: AcademyRivalStyle;
}

export interface SecondTeamCallupCandidate {
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
  careerStage: "ACADEMY" | "SECOND_TEAM" | "FIRST_TEAM";
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
  secondTeamSeason: SecondTeamSeasonState;
  evaluationHistory: AcademyEvaluationRecord[];
  academyScrimHistory: AcademyScrimRecord[];
  academyRivals: AcademyRival[];
  secondTeamCallupReady: boolean;
}

export interface GameState {
  version: 8;
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
