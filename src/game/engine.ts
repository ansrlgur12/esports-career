import { ACTIONS } from "../data/actions";
import { createSecondTeamLeagueTeams } from "../data/secondTeamRoster";
import {
  AcademyRival,
  ActionDef,
  AvatarState,
  DayType,
  GameState,
  Position,
  ScrimGrade,
  SecondTeamCallupCandidate,
  SecondTeamLeagueMatchResult,
  SecondTeamLeaguePlayer,
  SecondTeamLeagueState,
  SecondTeamLeagueTeamId,
  SecondTeamMatchRecord,
  SecondTeamStarterSeriesStats,
  StatKey,
  Stats,
  StatXp,
  TimeSlot,
  Weekday,
} from "../types/game";

const keys: StatKey[] = [
  "physical",
  "reaction",
  "accuracy",
  "movement",
  "focus",
  "laning",
  "cs",
  "killSense",
  "survival",
  "champPool",
  "macro",
  "vision",
  "decision",
  "objective",
  "teamfight",
  "calling",
  "synergy",
  "mental",
];

export const statLabels: Record<StatKey, string> = {
  physical: "피지컬",
  reaction: "반응속도",
  accuracy: "정확도",
  movement: "무빙",
  focus: "집중력",
  laning: "라인전",
  cs: "CS",
  killSense: "킬각",
  survival: "생존력",
  champPool: "챔프폭",
  macro: "운영",
  vision: "시야",
  decision: "판단력",
  objective: "오브젝트",
  teamfight: "한타",
  calling: "콜",
  synergy: "호흡",
  mental: "멘탈",
};

export const positions: Position[] = ["TOP", "JUNGLE", "MID", "BOT", "SUPPORT"];

export const defaultAvatar: AvatarState = {
  face: 0,
  eyes: 0,
  noseMouth: 0,
  hair: 0,
  accessory: 0,
};

export function xpNeeded(stat: number) {
  // 초반은 빠르게 성장하지만, 스탯이 높아질수록 요구 EXP가 계속 증가한다.
  // 50: 260 / 60: 367 / 70: 519 / 80: 734 / 100: 1466
  return Math.round(260 * Math.pow(1.035, Math.max(0, stat - 50)));
}

export function koreaDateKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export const weekdayLabels: Record<Weekday, string> = {
  SUN: "일",
  MON: "월",
  TUE: "화",
  WED: "수",
  THU: "목",
  FRI: "금",
  SAT: "토",
};

export function getWeekday(date: string): Weekday {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  const weekdays: Weekday[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  return weekdays[value];
}

/**
 * 아카데미 단계의 기본 주간 일정.
 *
 * 월~금: 일반 훈련
 * 토: 평가일 (향후 평가전/코치 평가 시스템 연결)
 * 일: 회복일
 */
export type LeagueLevel = "SECOND_TEAM" | "FIRST_TEAM";
export type ScheduleKind =
  | "REST"
  | "TRAINING"
  | "SCRIM"
  | "EVALUATION"
  | "REGULAR_MATCH"
  | "PLAYOFF_MATCH";

export interface CareerScheduleEntry {
  date: string;
  weekday: Weekday;
  kind: ScheduleKind;
  title: string;
  split: "SPRING" | "SUMMER";
  phase: "REGULAR" | "PLAYOFFS" | "OFFSEASON";
  round?: number;
  opponent?: string;
  bestOf?: 3 | 5;
}

const VORTEX_REGULAR_OPPONENTS = [
  "NOVA",
  "RAVEN",
  "APEX",
  "ZERO",
  "ORBIT",
  "TITAN",
  "PULSE",
  "ECLIPSE",
  "PHANTOM",
  "PHANTOM",
  "ECLIPSE",
  "PULSE",
  "TITAN",
  "ORBIT",
  "ZERO",
  "APEX",
  "RAVEN",
  "NOVA",
] as const;

function parseUtcDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
function dateKeyUtc(value: Date) {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
}
function addDaysKey(date: string, days: number) {
  const d = parseUtcDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return dateKeyUtc(d);
}
function splitForDate(date: string): "SPRING" | "SUMMER" {
  return Number(date.slice(5, 7)) <= 6 ? "SPRING" : "SUMMER";
}
function splitStart(year: number, split: "SPRING" | "SUMMER") {
  // 월요일은 리그 공통 휴식일. 첫 공식전은 다음 화요일부터 시작한다.
  const seed = new Date(Date.UTC(year, split === "SPRING" ? 0 : 6, 5));
  while (seed.getUTCDay() !== 2) seed.setUTCDate(seed.getUTCDate() + 1);
  return dateKeyUtc(seed);
}
function regularMatchDates(year: number, split: "SPRING" | "SUMMER") {
  const dates: string[] = [];
  let cursor = parseUtcDate(splitStart(year, split));
  // VORTEX는 화/목/토에 경기. 리그 전체는 화~일 다른 대진이 계속 진행된다.
  while (dates.length < 18) {
    const wd = cursor.getUTCDay();
    if (wd === 2 || wd === 4 || wd === 6) dates.push(dateKeyUtc(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export function getLeagueCalendarInfo(date: string) {
  const year = Number(date.slice(0, 4));
  const split = splitForDate(date);
  const dates = regularMatchDates(year, split);
  const regularIndex = dates.indexOf(date);
  const regularEnd = dates[17];
  const playoffStart = addDaysKey(regularEnd, 4);
  const playoffDates = [
    playoffStart,
    addDaysKey(playoffStart, 3),
    addDaysKey(playoffStart, 6),
    addDaysKey(playoffStart, 10),
  ];
  let phase: "REGULAR" | "PLAYOFFS" | "OFFSEASON" = "OFFSEASON";
  if (date >= dates[0] && date <= regularEnd) phase = "REGULAR";
  if (playoffDates.includes(date)) phase = "PLAYOFFS";
  return {
    year,
    split,
    phase,
    regularIndex,
    regularDates: dates,
    playoffDates,
  };
}

export function getCareerScheduleEntry(
  date: string,
  careerStage: GameState["player"]["careerStage"],
): CareerScheduleEntry {
  const weekday = getWeekday(date);
  const info = getLeagueCalendarInfo(date);
  const base = { date, weekday, split: info.split, phase: info.phase } as const;

  // 월요일: 1/2군 리그 공통 휴식. 선수도 회복일로 사용.
  if (weekday === "MON") return { ...base, kind: "REST", title: "리그 휴식일" };

  if (careerStage === "ACADEMY") {
    const dayOfMonth = Number(date.slice(8, 10));
    if (weekday === "TUE" && dayOfMonth <= 7)
      return { ...base, kind: "EVALUATION", title: "월간 아카데미 평가" };
    // 아카데미도 스크림을 매주 정확히 2회 강제하지 않는다.
    // 주말 팀훈련과 일부 비경기일에 편성한다.
    const academyScrimRoll = stableNumber(`${date}|ACADEMY|scrim-schedule`);
    if ((weekday === "SAT" || weekday === "SUN") && academyScrimRoll < 0.58) {
      return { ...base, kind: "SCRIM", title: "아카데미 팀 스크림" };
    }
    if (weekday === "WED" && academyScrimRoll < 0.22) {
      return { ...base, kind: "SCRIM", title: "아카데미 팀 스크림" };
    }
    return { ...base, kind: "TRAINING", title: "아카데미 팀훈련" };
  }

  if (info.regularIndex >= 0) {
    const round = info.regularIndex + 1;
    const opponent = VORTEX_REGULAR_OPPONENTS[info.regularIndex];
    return {
      ...base,
      kind: "REGULAR_MATCH",
      title: `${info.split === "SPRING" ? "스프링" : "서머"} 정규시즌 ${round}R`,
      round,
      opponent,
      bestOf: 3,
    };
  }

  const playoffIndex = info.playoffDates.indexOf(date);
  if (playoffIndex >= 0) {
    const names = ["와일드카드전", "1라운드", "2라운드", "결승전"];
    return {
      ...base,
      kind: "PLAYOFF_MATCH",
      title: `${info.split === "SPRING" ? "스프링" : "서머"} 플레이오프 · ${names[playoffIndex]}`,
      bestOf: playoffIndex === 0 ? 3 : 5,
    };
  }

  // 공식전 일정이 최우선이다.
  // 스크림은 고정 주 2회가 아니라, 공식전이 없는 리그 휴식일/주말 팀훈련 중 일부에만 편성한다.
  // 같은 날짜는 항상 같은 결과가 나오도록 날짜 기반으로 결정한다.
  const scrimRoll = stableNumber(`${date}|${careerStage}|scrim-schedule`);
  const isWeekend = weekday === "SAT" || weekday === "SUN";
  const isLeagueBreakDay = info.phase === "OFFSEASON";

  if (
    (isWeekend && scrimRoll < 0.48) ||
    (isLeagueBreakDay && scrimRoll < 0.34)
  ) {
    return {
      ...base,
      kind: "SCRIM",
      title: careerStage === "FIRST_TEAM" ? "1군 팀 스크림" : "2군 팀 스크림",
    };
  }

  return {
    ...base,
    kind: "TRAINING",
    title: careerStage === "FIRST_TEAM" ? "1군 팀훈련/리뷰" : "2군 팀훈련/리뷰",
  };
}

export function getScheduleRange(state: GameState, days = 28) {
  return Array.from({ length: days }, (_, i) => {
    const date = addDaysKey(state.date, i);
    return getCareerScheduleEntry(date, state.player.careerStage);
  });
}

export function getDayType(
  date: string,
  careerStage: GameState["player"]["careerStage"],
): DayType {
  const entry = getCareerScheduleEntry(date, careerStage);
  if (entry.kind === "REST") return "REST";
  if (entry.kind === "EVALUATION") return "EVALUATION";
  if (entry.kind === "SCRIM") return "SCRIM";
  if (entry.kind === "REGULAR_MATCH" || entry.kind === "PLAYOFF_MATCH") {
    return careerStage === "FIRST_TEAM"
      ? "FIRST_TEAM_MATCH"
      : "SECOND_TEAM_MATCH";
  }
  return "TRAINING";
}

export function getDayLabel(state: GameState) {
  const weekday = getWeekday(state.date);
  const dayType = getDayType(state.date, state.player.careerStage);

  return {
    weekday,
    weekdayLabel: weekdayLabels[weekday],
    dayType,
  };
}

export const SECOND_TEAM_OPPONENTS = [
  { id: "nova", name: "NOVA 2군", power: 61 },
  { id: "raven", name: "RAVEN 2군", power: 65 },
  { id: "apex", name: "APEX 2군", power: 68 },
  { id: "zero", name: "ZERO 2군", power: 63 },
  { id: "orbit", name: "ORBIT 2군", power: 70 },
  { id: "vortex", name: "VORTEX 2군", power: 66 },
  { id: "titan", name: "TITAN 2군", power: 72 },
  { id: "pulse", name: "PULSE 2군", power: 64 },
  { id: "eclipse", name: "ECLIPSE 2군", power: 69 },
  { id: "phantom", name: "PHANTOM 2군", power: 67 },
] as const;

export function getSecondTeamMatchInfo(state: GameState) {
  const season = state.player.secondTeamSeason ?? {
    round: 1,
    wins: 0,
    losses: 0,
    teamRank: 5,
    teamPower: 64,
    firstTeamInterest: 0,
    matchHistory: [],
  };
  const schedule = getCareerScheduleEntry(state.date, state.player.careerStage);
  const scheduledName = schedule.opponent ? `${schedule.opponent} 2군` : null;
  const opponent =
    SECOND_TEAM_OPPONENTS.find((item) => item.name === scheduledName) ??
    SECOND_TEAM_OPPONENTS[(season.round - 1) % SECOND_TEAM_OPPONENTS.length];
  return {
    round: season.round,
    opponent,
    teamPower: season.teamPower,
  };
}

export function getUpcomingSchedule(state: GameState) {
  if (
    state.player.careerStage === "ACADEMY" &&
    state.player.secondTeamCallupReady
  ) {
    const weekday = getWeekday(state.date);
    return {
      date: state.date,
      weekday,
      weekdayLabel: weekdayLabels[weekday],
      dayType: "PROMOTION" as const,
      daysAway: 0,
      title: "2군 콜업",
    };
  }

  const [year, month, day] = state.date.split("-").map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));

  // 오늘 오전의 공식 이벤트를 이미 끝냈다면 오늘 일정은 더 이상
  // "다가오는 이벤트"가 아니다. 다음 날부터 다시 탐색해야 한다.
  // 그렇지 않으면 시즌 round만 먼저 증가해서 제목은 다음 경기로 바뀌는데
  // 날짜/daysAway는 오늘(D-0)로 남는 현상이 발생한다.
  const searchStart =
    state.player.morningEventCompletedDate === state.date ? 1 : 0;

  for (let daysAway = searchStart; daysAway <= 28; daysAway++) {
    const target = new Date(base);
    target.setUTCDate(base.getUTCDate() + daysAway);
    const targetDate = [
      target.getUTCFullYear(),
      String(target.getUTCMonth() + 1).padStart(2, "0"),
      String(target.getUTCDate()).padStart(2, "0"),
    ].join("-");
    const dayType = getDayType(targetDate, state.player.careerStage);
    if (
      dayType === "EVALUATION" ||
      dayType === "SCRIM" ||
      dayType === "SECOND_TEAM_MATCH" ||
      dayType === "FIRST_TEAM_MATCH"
    ) {
      const weekday = getWeekday(targetDate);
      const academy = getSecondTeamMatchInfo(state);
      return {
        date: targetDate,
        weekday,
        weekdayLabel: weekdayLabels[weekday],
        dayType,
        daysAway,
        title:
          dayType === "EVALUATION"
            ? "월간 아카데미 평가"
            : dayType === "SCRIM"
              ? "팀 스크림"
              : `2군 리그 ${academy.round}R vs ${academy.opponent.name}`,
      };
    }
  }
  return null;
}

function createAcademyRivals(position: Position): AcademyRival[] {
  const otherPositions: Position[] = [
    "TOP",
    "JUNGLE",
    "MID",
    "BOT",
    "SUPPORT",
  ].filter((p) => p !== position) as Position[];

  return [
    {
      id: "kain",
      name: "KAIN",
      position,
      age: 17,
      ovr: 53,
      potential: 88,
      form: 62,
      coachRating: 48,
      scrimRating: 55,
      evaluationScore: 52,
      lastEvaluationGrade: null,
      trend: 0,
      style: "PRODIGY",
    },
    {
      id: "rune",
      name: "RUNE",
      position,
      age: 18,
      ovr: 51,
      potential: 80,
      form: 58,
      coachRating: 52,
      scrimRating: 51,
      evaluationScore: 50,
      lastEvaluationGrade: null,
      trend: 0,
      style: "STEADY",
    },
    {
      id: "nero",
      name: "NERO",
      position: otherPositions[0],
      age: 17,
      ovr: 54,
      potential: 82,
      form: 57,
      coachRating: 55,
      scrimRating: 54,
      evaluationScore: 53,
      lastEvaluationGrade: null,
      trend: 0,
      style: "WORKHORSE",
    },
    {
      id: "veil",
      name: "VEIL",
      position: otherPositions[1],
      age: 18,
      ovr: 52,
      potential: 84,
      form: 65,
      coachRating: 49,
      scrimRating: 57,
      evaluationScore: 51,
      lastEvaluationGrade: null,
      trend: 0,
      style: "SWINGY",
    },
    {
      id: "arc",
      name: "ARC",
      position: otherPositions[2],
      age: 17,
      ovr: 50,
      potential: 86,
      form: 60,
      coachRating: 51,
      scrimRating: 52,
      evaluationScore: 50,
      lastEvaluationGrade: null,
      trend: 0,
      style: "SMART",
    },
  ];
}

function rivalScore(rival: AcademyRival) {
  return (
    rival.evaluationScore * 0.35 +
    rival.scrimRating * 0.25 +
    rival.ovr * 0.25 +
    rival.coachRating * 0.15
  );
}

function playerCompetitionScore(state: GameState) {
  const evals = state.player.evaluationHistory ?? [];
  const scrims = state.player.academyScrimHistory ?? [];
  const evaluation = evals.length
    ? evals[evals.length - 1].performanceScore
    : 50;
  const scrim = scrims.length
    ? scrims.slice(-6).reduce((sum, x) => sum + x.performanceScore, 0) /
      Math.min(6, scrims.length)
    : 50;
  const ovr = calculateOvr(state.player.stats, state.player.position);
  return (
    evaluation * 0.35 +
    scrim * 0.25 +
    ovr * 0.25 +
    state.player.coachTrust * 0.15
  );
}

export function getAcademyStandings(state: GameState) {
  const rows = [
    {
      id: "player",
      name: state.player.name,
      position: state.player.position,
      ovr: calculateOvr(state.player.stats, state.player.position),
      score: playerCompetitionScore(state),
      trend: 0 as -1 | 0 | 1,
      isPlayer: true,
    },
    ...(state.player.academyRivals ?? []).map((rival) => ({
      id: rival.id,
      name: rival.name,
      position: rival.position,
      ovr: rival.ovr,
      score: rivalScore(rival),
      trend: rival.trend,
      isPlayer: false,
    })),
  ].sort((a, b) => b.score - a.score);

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

export function getPositionStandings(state: GameState) {
  return getAcademyStandings(state).filter(
    (row) => row.position === state.player.position,
  );
}

export function getSecondTeamCallupCandidates(
  state: GameState,
): SecondTeamCallupCandidate[] {
  const standings = getAcademyStandings(state);
  const positionGroups = new Map<Position, typeof standings>();

  for (const row of standings) {
    const group = positionGroups.get(row.position) ?? [];
    group.push(row);
    positionGroups.set(row.position, group);
  }

  const candidates: SecondTeamCallupCandidate[] = [];

  for (const [position, rows] of positionGroups.entries()) {
    rows.forEach((row, index) => {
      const positionRank = index + 1;
      if (positionRank > 2) return;

      const bonus = positionRank === 1 ? 8 : 3;
      const candidateScore = Math.round(row.score + bonus);
      const reason =
        positionRank === 1
          ? `${position} 포지션 1위 · 최근 경쟁력 우수`
          : `${position} 포지션 2위 · 콜업 경쟁권`;

      candidates.push({
        id: row.id,
        name: row.name,
        position,
        score: candidateScore,
        positionRank,
        isPlayer: row.isPlayer,
        reason,
      });
    });
  }

  return candidates.sort((a, b) => b.score - a.score).slice(0, 3);
}

function simulateRivals(
  rivals: AcademyRival[],
  seed: number,
  monthlyEvaluation = false,
) {
  return rivals.map((rival, index) => {
    const n = Math.sin((seed + index * 31) * 12.9898) * 43758.5453;
    const roll = n - Math.floor(n);
    const styleGrowth =
      rival.style === "PRODIGY"
        ? 0.55
        : rival.style === "WORKHORSE"
          ? 0.38
          : rival.style === "STEADY"
            ? 0.28
            : 0.22;
    const growthChance = Math.min(
      0.8,
      0.22 + (rival.potential - rival.ovr) / 100 + styleGrowth,
    );
    const ovrGain = roll < growthChance ? 1 : 0;
    const formSwing =
      rival.style === "SWINGY"
        ? Math.round((roll - 0.5) * 16)
        : Math.round((roll - 0.5) * 8);
    const form = Math.max(30, Math.min(95, rival.form + formSwing));
    const scrimRating = Math.max(
      35,
      Math.min(95, Math.round(rival.ovr * 0.55 + form * 0.45)),
    );
    const evaluationScore = monthlyEvaluation
      ? Math.max(
          35,
          Math.min(
            98,
            Math.round(
              scrimRating * 0.55 +
                rival.coachRating * 0.2 +
                (rival.ovr + ovrGain) * 0.25,
            ),
          ),
        )
      : rival.evaluationScore;
    const grade: ScrimGrade =
      evaluationScore >= 90
        ? "S"
        : evaluationScore >= 82
          ? "A+"
          : evaluationScore >= 74
            ? "A"
            : evaluationScore >= 66
              ? "B+"
              : evaluationScore >= 56
                ? "B"
                : "C";
    const previous = rivalScore(rival);
    const next: AcademyRival = {
      ...rival,
      ovr: rival.ovr + ovrGain,
      form,
      scrimRating,
      evaluationScore,
      lastEvaluationGrade: monthlyEvaluation
        ? grade
        : rival.lastEvaluationGrade,
      coachRating: Math.max(
        30,
        Math.min(
          95,
          rival.coachRating +
            (monthlyEvaluation
              ? evaluationScore >= 75
                ? 2
                : evaluationScore < 50
                  ? -1
                  : 0
              : 0),
        ),
      ),
      trend: 0,
    };
    const diff = rivalScore(next) - previous;
    next.trend = diff > 1 ? 1 : diff < -1 ? -1 : 0;
    return next;
  });
}

export function newGame(
  name: string,
  position: Position,
  avatar: AvatarState = defaultAvatar,
): GameState {
  const stats = {} as Stats;
  const xp = {} as StatXp;

  keys.forEach((k) => {
    stats[k] = 50;
    xp[k] = 0;
  });

  return {
    version: 8,
    date: "2027-01-01",
    slot: "MORNING",
    actionSeed: 1,
    recovery: {
      dateKey: koreaDateKey(),
      used: 0,
    },
    player: {
      name: name.trim() || "ROOKIE",
      position,
      age: 17,
      careerStage: "ACADEMY",
      avatar: { ...avatar },
      stats,
      xp,
      stamina: 100,
      condition: 100,
      stress: 0,
      coachTrust: 0,
      starterCompetition: 0,
      annualSalary: 24000000,
      morningEventCompletedDate: null,
      seasonStats: {
        games: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
      },
      secondTeamSeason: {
        year: 2027,
        split: "SPRING",
        phase: "REGULAR",
        round: 1,
        wins: 0,
        losses: 0,
        teamRank: 5,
        teamPower: 64,
        firstTeamInterest: 0,
        matchHistory: [],
        leagueState: { results: [], teams: createSecondTeamLeagueTeams() },
      },
      evaluationHistory: [],
      academyScrimHistory: [],
      academyRivals: createAcademyRivals(position),
      secondTeamCallupReady: false,
    },
  };
}

function normalizeAvatar(raw: any): AvatarState {
  return {
    face: Math.max(0, Math.min(2, raw?.face ?? 0)),
    eyes: Math.max(0, Math.min(2, raw?.eyes ?? 0)),
    noseMouth: Math.max(0, Math.min(2, raw?.noseMouth ?? raw?.mouth ?? 0)),
    hair: Math.max(0, Math.min(3, raw?.hair ?? 0)),
    accessory: Math.max(0, Math.min(2, raw?.accessory ?? 0)),
  };
}

export function migrateGame(raw: any): GameState {
  const base = newGame(
    raw?.player?.name ?? "MOON",
    raw?.player?.position ?? "MID",
    normalizeAvatar(raw?.player?.avatar),
  );

  const seasonStats = raw?.player?.seasonStats ?? {
    games: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
  };

  const secondTeamSeason = {
    round: raw?.player?.secondTeamSeason?.round ?? seasonStats.games + 1,
    wins: raw?.player?.secondTeamSeason?.wins ?? 0,
    losses: raw?.player?.secondTeamSeason?.losses ?? 0,
    teamRank: raw?.player?.secondTeamSeason?.teamRank ?? 5,
    teamPower: raw?.player?.secondTeamSeason?.teamPower ?? 64,
    firstTeamInterest: raw?.player?.secondTeamSeason?.firstTeamInterest ?? 0,
    matchHistory: raw?.player?.secondTeamSeason?.matchHistory ?? [],
    leagueState:
      raw?.player?.secondTeamSeason?.leagueState?.teams?.length === 10
        ? raw.player.secondTeamSeason.leagueState
        : {
            results: raw?.player?.secondTeamSeason?.leagueState?.results ?? [],
            teams: createSecondTeamLeagueTeams(),
          },
  };

  return refreshRecovery({
    ...base,
    ...raw,
    version: 8,
    recovery: raw?.recovery ?? base.recovery,
    player: {
      ...base.player,
      ...raw?.player,
      avatar: normalizeAvatar(raw?.player?.avatar),
      age: raw?.player?.age ?? 17,
      careerStage:
        raw?.player?.careerStage === "FIRST_TEAM"
          ? "FIRST_TEAM"
          : raw?.player?.careerStage === "SECOND_TEAM" ||
              raw?.player?.careerStage === "ACADEMY"
            ? "SECOND_TEAM"
            : "ACADEMY",
      coachTrust: raw?.player?.coachTrust ?? 0,
      starterCompetition: raw?.player?.starterCompetition ?? 0,
      annualSalary:
        raw?.player?.annualSalary ??
        (raw?.player?.careerStage === "ACADEMY" ||
        raw?.player?.careerStage === "SECOND_TEAM"
          ? 36000000
          : 24000000),
      morningEventCompletedDate: raw?.player?.morningEventCompletedDate ?? null,
      seasonStats,
      secondTeamSeason,
      evaluationHistory: raw?.player?.evaluationHistory ?? [],
      academyScrimHistory:
        raw?.player?.academyScrimHistory ??
        raw?.player?.traineeScrimHistory ??
        [],
      academyRivals:
        raw?.player?.academyRivals ??
        raw?.player?.traineeRivals ??
        createAcademyRivals(raw?.player?.position ?? "MID"),
      secondTeamCallupReady:
        raw?.player?.secondTeamCallupReady ??
        raw?.player?.academyPromotionReady ??
        false,
    },
  });
}

export function refreshRecovery(state: GameState): GameState {
  const today = koreaDateKey();

  if (state.recovery?.dateKey === today) return state;

  return {
    ...state,
    recovery: {
      dateKey: today,
      used: 0,
    },
  };
}

export function recoveryRemaining(state: GameState) {
  return Math.max(0, 2 - refreshRecovery(state).recovery.used);
}

export function useFullRecovery(state: GameState): GameState {
  const s = refreshRecovery(state);

  if (s.recovery.used >= 2) return s;

  return {
    ...s,
    recovery: {
      ...s.recovery,
      used: s.recovery.used + 1,
    },
    player: {
      ...s.player,
      stamina: 100,
      condition: 100,
      stress: 0,
    },
  };
}

function rng(seed: number) {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function generateActions(state: GameState): ActionDef[] {
  const balancedActions = ACTIONS.map((action) => {
    // 일반 훈련의 체력 소모를 완화한다.
    // 솔로랭크/팀 스크림은 고강도 활동으로 유지한다.
    if (action.id === "solo-queue") return { ...action, stamina: -14 };
    if (action.id === "scrim") return { ...action, stamina: -18 };

    // 수면은 가장 강한 일반 체력 회복 행동.
    if (action.id === "sleep") return { ...action, stamina: 28 };
    if (action.id === "rest") return { ...action, stamina: 18 };
    if (action.id === "self-care") return { ...action, stamina: 14 };

    const isTraining =
      action.id.includes("training") ||
      action.id === "macro-analysis" ||
      action.id === "replay-analysis";

    if (isTraining && action.stamina < -7) {
      return { ...action, stamina: -7 };
    }

    return action;
  });

  const sleep = balancedActions.find((a) => a.id === "sleep");

  // 수면은 랜덤 풀에서 제외
  // 명상은 저녁에만 등장
  const dayType = getDayType(state.date, state.player.careerStage);

  const candidates = balancedActions.filter((a) => {
    if (a.id === "sleep") return false;

    if (a.id === "meditation" && state.slot !== "EVENING") {
      return false;
    }

    // 일요일은 회복일.
    // 강제 수면 외에는 회복/생활 행동만 등장한다.
    if (dayType === "REST") {
      return a.tags.includes("RECOVERY") || a.tags.includes("LIFE");
    }

    return true;
  });

  const pool = candidates.map((a) => {
    let w = a.weight;

    if (dayType === "REST") {
      if (a.tags.includes("RECOVERY")) w *= 1.6;
      if (a.tags.includes("LIFE")) w *= 1.25;
    }

    // =====================================================
    // 포지션 가중치
    // =====================================================

    if (a.tags.includes(state.player.position)) {
      w *= 1.7;
    }

    if (a.tags.includes("ALL") || a.tags.includes("TEAM")) {
      w *= 1.15;
    }

    // =====================================================
    // 시간대 가중치
    // =====================================================

    if (state.slot === "MORNING") {
      // 오전: 개인훈련 / 분석 중심

      if (
        a.id.includes("training") ||
        a.id === "macro-analysis" ||
        a.id === "replay-analysis"
      ) {
        w *= 1.35;
      }

      // 오전 스크림은 비교적 드물게
      if (a.id === "scrim") {
        w *= 0.55;
      }

      // 생활 활동은 오전에 덜 등장
      if (a.id === "streaming" || a.id === "team-time") {
        w *= 0.45;
      }
    }

    if (state.slot === "AFTERNOON") {
      // 오후: 팀 훈련 / 실전 중심

      if (a.id === "scrim") {
        w *= 2.2;
      }

      if (a.id === "teamfight-training") {
        w *= 1.4;
      }

      if (a.id === "teamwork-training") {
        w *= 1.5;
      }

      if (a.id === "calling-training") {
        w *= 1.35;
      }

      if (a.id === "solo-queue") {
        w *= 1.1;
      }

      if (a.id === "streaming") {
        w *= 0.6;
      }
    }

    if (state.slot === "EVENING") {
      // 저녁: 솔랭 / 생활 / 회복 중심

      if (a.id === "solo-queue") {
        w *= 1.7;
      }

      if (a.id === "streaming") {
        w *= 2.0;
      }

      if (a.id === "team-time") {
        w *= 1.7;
      }

      if (a.id === "meditation") {
        w *= 2.2;
      }

      if (a.id === "rest" || a.id === "self-care") {
        w *= 1.5;
      }

      // 전문훈련도 가능하지만 확률은 낮춤
      if (a.id.includes("training")) {
        w *= 0.65;
      }

      // 저녁 스크림은 드물게
      if (a.id === "scrim") {
        w *= 0.45;
      }
    }

    // =====================================================
    // 체력 상태에 따른 회복 행동 가중치
    // =====================================================

    if (state.player.stamina < 60 && a.tags.includes("RECOVERY")) {
      w *= 1.6;
    }

    if (state.player.stamina < 40 && a.tags.includes("RECOVERY")) {
      w *= 2.5;
    }

    if (state.player.stamina < 20 && a.tags.includes("RECOVERY")) {
      w *= 2.0;
    }

    // =====================================================
    // 스트레스가 높으면 회복 계열 등장 확률 증가
    // =====================================================

    if (state.player.stress >= 60) {
      if (a.id === "rest" || a.id === "self-care" || a.id === "meditation") {
        w *= 1.7;
      }
    }

    if (state.player.stress >= 80) {
      if (a.id === "self-care" || a.id === "meditation") {
        w *= 1.5;
      }
    }

    // =====================================================
    // 컨디션이 나쁘면 관리 행동 확률 증가
    // =====================================================

    if (state.player.condition < 50 && a.id === "self-care") {
      w *= 1.8;
    }

    if (state.player.condition < 30 && a.id === "self-care") {
      w *= 1.5;
    }

    return {
      a,
      w,
    };
  });

  // 오전/오후 = 랜덤 4개
  // 저녁 = 랜덤 3개 + 수면
  const target = state.slot === "EVENING" ? 3 : 4;

  const out: ActionDef[] = [];
  let seed = state.actionSeed;

  while (out.length < target) {
    seed++;

    // 같은 선택지 중복 방지
    const available = pool.filter((x) => !out.includes(x.a));

    const total = available.reduce((sum, x) => sum + x.w, 0);

    if (!available.length || total <= 0) {
      break;
    }

    let r = rng(seed) * total;

    for (const x of available) {
      r -= x.w;

      if (r <= 0) {
        out.push(x.a);
        break;
      }
    }
  }

  // 저녁에는 마지막 한 칸 수면 고정
  if (state.slot === "EVENING" && sleep) {
    out.push(sleep);
  }

  return out.slice(0, 4);
}

const clamp = (v: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, v));

export function applyAction(state: GameState, action: ActionDef): GameState {
  const current = refreshRecovery(state);
  const p = JSON.parse(JSON.stringify(current.player)) as GameState["player"];

  const efficiency =
    p.stamina >= 80
      ? 1
      : p.stamina >= 60
        ? 0.95
        : p.stamina >= 40
          ? 0.85
          : p.stamina >= 20
            ? 0.65
            : 0.4;

  for (const [k, v] of Object.entries(action.xp) as [StatKey, number][]) {
    p.xp[k] += Math.round(v * efficiency);

    while (p.xp[k] >= xpNeeded(p.stats[k])) {
      p.xp[k] -= xpNeeded(p.stats[k]);
      p.stats[k]++;
    }
  }

  p.stamina = clamp(p.stamina + action.stamina);
  p.condition = clamp(p.condition + action.condition);
  p.stress = clamp(p.stress + action.stress);

  const next = advance(current.date, current.slot);

  return {
    ...current,
    ...next,
    actionSeed: current.actionSeed + 17,
    player: p,
  };
}

function advance(
  date: string,
  slot: TimeSlot,
): { date: string; slot: TimeSlot } {
  // 오전 → 오후
  if (slot === "MORNING") {
    return {
      date,
      slot: "AFTERNOON",
    };
  }

  // 오후 → 저녁
  if (slot === "AFTERNOON") {
    return {
      date,
      slot: "EVENING",
    };
  }

  // 저녁 행동 완료 → 다음 날 오전
  const [year, month, day] = date.split("-").map(Number);

  // UTC 기준으로 날짜 계산해서 타임존 영향 제거
  const nextDate = new Date(Date.UTC(year, month - 1, day));
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  const nextYear = nextDate.getUTCFullYear();
  const nextMonth = String(nextDate.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(nextDate.getUTCDate()).padStart(2, "0");

  return {
    date: `${nextYear}-${nextMonth}-${nextDay}`,
    slot: "MORNING",
  };
}

export function completeAcademyScrim(
  state: GameState,
  result: {
    grade: ScrimGrade;
    performanceScore: number;
    win: boolean;
    playerKills: number;
    playerDeaths: number;
    playerAssists: number;
  },
): GameState {
  const current = refreshRecovery(state);
  const academyScrimHistory = [
    ...(current.player.academyScrimHistory ?? []),
    {
      date: current.date,
      grade: result.grade,
      performanceScore: result.performanceScore,
      win: result.win,
      kills: result.playerKills,
      deaths: result.playerDeaths,
      assists: result.playerAssists,
    },
  ].slice(-24);

  // 정기 스크림은 기록과 피드백은 남기되 월간 평가 횟수/시즌 KDA에는 직접 포함하지 않는다.
  // 좋은 스크림은 코치 신뢰에 아주 작게만 영향을 준다.
  const trustDelta =
    result.performanceScore >= 85 ? 1 : result.performanceScore < 45 ? -1 : 0;

  return {
    ...current,
    date: current.date,
    slot: "AFTERNOON",
    actionSeed: current.actionSeed + 73,
    player: {
      ...current.player,
      academyScrimHistory,
      morningEventCompletedDate: current.date,
      academyRivals: simulateRivals(
        current.player.academyRivals ?? [],
        current.actionSeed + 73,
        false,
      ),
      coachTrust: Math.max(0, current.player.coachTrust + trustDelta),
      stamina: Math.max(0, current.player.stamina - 14),
      condition: Math.max(0, current.player.condition - 4),
      stress: Math.min(100, current.player.stress + 3),
    },
  };
}

export function promoteToSecondTeam(state: GameState): GameState {
  if (
    state.player.careerStage !== "ACADEMY" ||
    !state.player.secondTeamCallupReady
  ) {
    return state;
  }

  return {
    ...state,
    actionSeed: state.actionSeed + 211,
    player: {
      ...state.player,
      careerStage: "SECOND_TEAM",
      secondTeamCallupReady: false,
      annualSalary: Math.max(state.player.annualSalary ?? 24000000, 36000000),
      starterCompetition: Math.max(10, state.player.starterCompetition),
      seasonStats: { games: 0, kills: 0, deaths: 0, assists: 0 },
      secondTeamSeason: {
        round: 1,
        wins: 0,
        losses: 0,
        teamRank: 5,
        teamPower: 64,
        firstTeamInterest: 0,
        matchHistory: [],
      },
    },
  };
}

export function completeSecondTeamMatch(
  state: GameState,
  result: {
    win: boolean;
    playerKills: number;
    playerDeaths: number;
    playerAssists: number;
    performanceScore: number;
    setWins?: number;
    setLosses?: number;
    starterStats?: SecondTeamStarterSeriesStats;
  },
): GameState {
  const current = refreshRecovery(state);
  const previous = current.player.seasonStats ?? {
    games: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
  };
  const season = current.player.secondTeamSeason ?? {
    round: previous.games + 1,
    wins: 0,
    losses: 0,
    teamRank: 5,
    teamPower: 64,
    firstTeamInterest: 0,
    matchHistory: [],
  };
  const matchInfo = getSecondTeamMatchInfo(current);

  const record = {
    round: matchInfo.round,
    date: current.date,
    opponentId: matchInfo.opponent.id,
    opponentName: matchInfo.opponent.name,
    opponentPower: matchInfo.opponent.power,
    win: result.win,
    kills: result.playerKills,
    deaths: result.playerDeaths,
    assists: result.playerAssists,
    performanceScore: result.performanceScore,
    playerParticipated: true,
    // 기존 저장 타입을 깨지 않고 matchHistory에 영속화한다.
    starterStats: result.starterStats,
  };

  const wins = season.wins + (result.win ? 1 : 0);
  const losses = season.losses + (result.win ? 0 : 1);
  const interestDelta =
    result.performanceScore >= 85
      ? 8
      : result.performanceScore >= 75
        ? 5
        : result.performanceScore >= 65
          ? 2
          : result.performanceScore < 50
            ? -2
            : 0;

  // 임시 리그 순위: 승률과 누적 승수를 기반으로 1~10위 범위에서 갱신.
  const games = wins + losses;
  const winRate = games > 0 ? wins / games : 0;
  const teamRank = Math.max(
    1,
    Math.min(10, 10 - Math.round(winRate * 6 + wins * 0.35)),
  );

  const setWins = result.setWins ?? (result.win ? 2 : 1);
  const setLosses = result.setLosses ?? (result.win ? 1 : 2);
  const leagueState = applyCompletedLeagueRound(
    current,
    matchInfo.round,
    matchInfo.opponent.name,
    result.win,
    setWins,
    setLosses,
    result.starterStats,
  );
  const realStandings = calculateLeagueStandings(leagueState.results);
  const realTeamRank =
    realStandings.findIndex((row) => row.team === "VORTEX") + 1;

  return {
    ...current,
    date: current.date,
    slot: "AFTERNOON",
    actionSeed: current.actionSeed + 307,
    player: {
      ...current.player,
      morningEventCompletedDate: current.date,
      seasonStats: {
        games: previous.games + 1,
        kills: previous.kills + result.playerKills,
        deaths: previous.deaths + result.playerDeaths,
        assists: previous.assists + result.playerAssists,
      },
      secondTeamSeason: {
        ...season,
        round: season.round + 1,
        wins,
        losses,
        teamRank: realTeamRank || teamRank,
        leagueState,
        firstTeamInterest: Math.max(
          0,
          Math.min(100, season.firstTeamInterest + interestDelta),
        ),
        matchHistory: [...season.matchHistory, record].slice(-20),
      },
      coachTrust: Math.max(
        0,
        current.player.coachTrust +
          (result.performanceScore >= 75
            ? 2
            : result.performanceScore < 50
              ? -1
              : 0),
      ),
      stamina: Math.max(0, current.player.stamina - 20),
      condition: Math.max(0, current.player.condition - 7),
      stress: Math.min(100, current.player.stress + 4),
    },
  };
}

export function getAcademyRank(state: GameState) {
  const standings = getAcademyStandings(state);
  const player = standings.find((row) => row.isPlayer);
  return { rank: player?.rank ?? standings.length, total: standings.length };
}

export function getPromotionChanceLabel(state: GameState) {
  const recent = (state.player.evaluationHistory ?? []).slice(-3);
  const recentAverage =
    recent.length === 0
      ? 0
      : recent.reduce((sum, item) => sum + item.performanceScore, 0) /
        recent.length;

  const score =
    state.player.coachTrust * 0.45 +
    state.player.starterCompetition * 0.35 +
    recentAverage * 0.2;

  if (score >= 75) return "매우 높음";
  if (score >= 62) return "높음";
  if (score >= 48) return "보통";
  if (score >= 34) return "낮음";
  return "매우 낮음";
}

function getAcademyRankFromValues(
  coachTrust: number,
  starterCompetition: number,
  ovr: number,
) {
  const score = coachTrust * 0.45 + starterCompetition * 0.35 + ovr * 0.2;
  if (score >= 78) return 1;
  if (score >= 66) return 2;
  if (score >= 54) return 3;
  if (score >= 42) return 4;
  if (score >= 30) return 5;
  return 6;
}

function promotionChanceFromScore(score: number) {
  if (score >= 75) return "매우 높음";
  if (score >= 62) return "높음";
  if (score >= 48) return "보통";
  if (score >= 34) return "낮음";
  return "매우 낮음";
}

export function completeAcademyEvaluation(
  state: GameState,
  result: {
    grade: ScrimGrade;
    performanceScore: number;
    win: boolean;
    coachTrustDelta: number;
    starterCompetitionDelta: number;
  },
): GameState {
  const current = refreshRecovery(state);

  const recentScrims = (current.player.academyScrimHistory ?? []).slice(-8);
  const scrimAverage =
    recentScrims.length > 0
      ? recentScrims.reduce((sum, item) => sum + item.performanceScore, 0) /
        recentScrims.length
      : result.performanceScore;
  const ovr = calculateOvr(current.player.stats, current.player.position);
  const readiness =
    current.player.condition * 0.45 +
    current.player.stamina * 0.25 +
    (100 - current.player.stress) * 0.3;

  const monthlyPerformanceScore = Math.round(
    result.performanceScore * 0.5 +
      scrimAverage * 0.25 +
      ovr * 0.15 +
      readiness * 0.1,
  );

  const monthlyGrade: ScrimGrade =
    monthlyPerformanceScore >= 90
      ? "S"
      : monthlyPerformanceScore >= 82
        ? "A+"
        : monthlyPerformanceScore >= 74
          ? "A"
          : monthlyPerformanceScore >= 66
            ? "B+"
            : monthlyPerformanceScore >= 56
              ? "B"
              : "C";

  const rankBefore = getAcademyRank(current).rank;
  const positionRankBefore =
    getPositionStandings(current).findIndex((row) => row.isPlayer) + 1;
  const previousRecent = (current.player.evaluationHistory ?? []).slice(-3);
  const previousAverage =
    previousRecent.length === 0
      ? 0
      : previousRecent.reduce((sum, item) => sum + item.performanceScore, 0) /
        previousRecent.length;
  const promotionChanceBefore = promotionChanceFromScore(
    current.player.coachTrust * 0.45 +
      current.player.starterCompetition * 0.35 +
      previousAverage * 0.2,
  );

  const nextCoachTrust = Math.max(
    0,
    (current.player.coachTrust ?? 0) + result.coachTrustDelta,
  );
  const nextStarterCompetition = Math.max(
    0,
    (current.player.starterCompetition ?? 0) + result.starterCompetitionDelta,
  );

  const evaluationHistory = [
    ...(current.player.evaluationHistory ?? []),
    {
      date: current.date,
      grade: monthlyGrade,
      performanceScore: monthlyPerformanceScore,
      win: result.win,
      matchScore: result.performanceScore,
      scrimScore: Math.round(scrimAverage),
      ovrScore: Math.round(ovr),
      readinessScore: Math.round(readiness),
      rankBefore,
      coachTrustBefore: current.player.coachTrust,
    },
  ].slice(-8);

  const recent = evaluationHistory.slice(-3);
  const recentAverage =
    recent.reduce((sum, item) => sum + item.performanceScore, 0) /
    Math.max(1, recent.length);

  // 경쟁자들도 같은 월간 평가 주기에 성장/평가된다.
  const nextRivals = simulateRivals(
    current.player.academyRivals ?? [],
    current.actionSeed + 191,
    true,
  );
  const rankState: GameState = {
    ...current,
    player: {
      ...current.player,
      coachTrust: nextCoachTrust,
      starterCompetition: nextStarterCompetition,
      evaluationHistory,
      morningEventCompletedDate: current.date,
      academyRivals: nextRivals,
    },
  };

  // 실제 전체/포지션 경쟁 순위를 다시 계산한다.
  const rankAfter = getAcademyRank(rankState).rank;
  const positionStandingsAfter = getPositionStandings(rankState);
  const positionRankAfter =
    positionStandingsAfter.findIndex((row) => row.isPlayer) + 1;
  const closestRival =
    positionStandingsAfter.find((row) => !row.isPlayer) ?? null;

  const rivalryMessage =
    positionRankAfter < positionRankBefore
      ? `${closestRival?.name ?? "경쟁자"}를 제치며 ${current.player.position} 경쟁 ${positionRankAfter}위로 올라섰습니다.`
      : positionRankAfter > positionRankBefore
        ? `${closestRival?.name ?? "경쟁자"}에게 밀리며 ${current.player.position} 경쟁 ${positionRankAfter}위로 내려갔습니다.`
        : positionRankAfter === 1
          ? `${current.player.position} 아카데미 경쟁 1위를 지켰습니다.`
          : `${current.player.position} 경쟁 ${positionRankAfter}위를 유지했습니다.`;

  const promotionChanceAfter = promotionChanceFromScore(
    nextCoachTrust * 0.45 + nextStarterCompetition * 0.35 + recentAverage * 0.2,
  );

  // Store before/after values on the newest monthly evaluation record.
  evaluationHistory[evaluationHistory.length - 1] = {
    ...evaluationHistory[evaluationHistory.length - 1],
    rankAfter,
    positionRankBefore,
    positionRankAfter,
    rivalName: closestRival?.name,
    rivalScore: closestRival ? Math.round(closestRival.score) : undefined,
    rivalryMessage,
    coachTrustAfter: nextCoachTrust,
    promotionChanceBefore,
    promotionChanceAfter,
  };

  const secondTeamCallupReady =
    evaluationHistory.length >= 3 &&
    nextCoachTrust >= 55 &&
    nextStarterCompetition >= 55 &&
    recentAverage >= 72 &&
    positionRankAfter <= 2;

  return {
    ...current,
    date: current.date,
    slot: "AFTERNOON",
    actionSeed: current.actionSeed + 101,
    player: {
      ...current.player,
      coachTrust: nextCoachTrust,
      starterCompetition: nextStarterCompetition,
      evaluationHistory,
      academyRivals: nextRivals,
      secondTeamCallupReady,
      stamina: Math.max(0, current.player.stamina - 18),
      condition: Math.max(0, current.player.condition - 6),
      stress: Math.min(100, current.player.stress + 5),
    },
  };
}

const OVR_WEIGHTS: Record<Position, Record<StatKey, number>> = {
  TOP: {
    physical: 8,
    reaction: 7,
    accuracy: 5,
    movement: 7,
    focus: 4,

    laning: 10,
    cs: 8,
    killSense: 8,
    survival: 7,
    champPool: 5,

    macro: 5,
    vision: 2,
    decision: 5,
    objective: 2,
    teamfight: 7,

    calling: 2,
    synergy: 4,
    mental: 6,
  },

  JUNGLE: {
    physical: 5,
    reaction: 4,
    accuracy: 3,
    movement: 5,
    focus: 4,

    laning: 2,
    cs: 2,
    killSense: 6,
    survival: 5,
    champPool: 7,

    macro: 9,
    vision: 8,
    decision: 10,
    objective: 10,
    teamfight: 7,

    calling: 6,
    synergy: 4,
    mental: 3,
  },

  MID: {
    physical: 8,
    reaction: 7,
    accuracy: 6,
    movement: 7,
    focus: 5,

    laning: 10,
    cs: 8,
    killSense: 8,
    survival: 5,
    champPool: 5,

    macro: 5,
    vision: 2,
    decision: 6,
    objective: 2,
    teamfight: 7,

    calling: 2,
    synergy: 4,
    mental: 3,
  },

  BOT: {
    physical: 9,
    reaction: 9,
    accuracy: 8,
    movement: 10,
    focus: 7,

    laning: 9,
    cs: 10,
    killSense: 7,
    survival: 6,
    champPool: 4,

    macro: 3,
    vision: 2,
    decision: 5,
    objective: 2,
    teamfight: 6,

    calling: 1,
    synergy: 1,
    mental: 1,
  },

  SUPPORT: {
    physical: 3,
    reaction: 3,
    accuracy: 2,
    movement: 4,
    focus: 4,

    laning: 4,
    cs: 2,
    killSense: 3,
    survival: 5,
    champPool: 6,

    macro: 8,
    vision: 12,
    decision: 10,
    objective: 8,
    teamfight: 7,

    calling: 8,
    synergy: 6,
    mental: 5,
  },
};

export function calculateOvr(stats: Stats, position: Position): number {
  const weights = OVR_WEIGHTS[position];

  let total = 0;

  for (const key of Object.keys(stats) as StatKey[]) {
    total += stats[key] * weights[key];
  }

  return Math.round(total / 100);
}

export type SecondTeamMatchRole = "PLAY" | "BENCH";

export interface SecondTeamStarterProfile {
  id: string;
  name: string;
  position: Position;
  age: number;
  ovr: number;
  form: number;
  coachTrust: number;
  recentKda: number;
}

export interface SecondTeamCompetitionInfo {
  starter: SecondTeamStarterProfile;
  playerScore: number;
  starterScore: number;
  gap: number;
  status: string;
}

const SECOND_TEAM_STARTERS: Record<Position, SecondTeamStarterProfile> = {
  TOP: {
    id: "vortex2-top-rook",
    name: "ROOK",
    position: "TOP",
    age: 19,
    ovr: 59,
    form: 72,
    coachTrust: 69,
    recentKda: 3.15,
  },
  JUNGLE: {
    id: "vortex2-jg-lynx",
    name: "LYNX",
    position: "JUNGLE",
    age: 18,
    ovr: 60,
    form: 75,
    coachTrust: 71,
    recentKda: 4.02,
  },
  MID: {
    id: "vortex2-mid-kain",
    name: "KAIN",
    position: "MID",
    age: 18,
    ovr: 58,
    form: 78,
    coachTrust: 72,
    recentKda: 4.31,
  },
  BOT: {
    id: "vortex2-bot-rex",
    name: "REX",
    position: "BOT",
    age: 19,
    ovr: 61,
    form: 74,
    coachTrust: 73,
    recentKda: 4.68,
  },
  SUPPORT: {
    id: "vortex2-sup-noah",
    name: "NOAH",
    position: "SUPPORT",
    age: 20,
    ovr: 57,
    form: 80,
    coachTrust: 76,
    recentKda: 5.12,
  },
};

function stableNumber(seedText: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function getRecordedStarterStats(
  record: SecondTeamMatchRecord,
): SecondTeamStarterSeriesStats | null {
  const stats = record.starterStats;
  if (!stats || typeof stats.sets !== "number" || stats.sets <= 0) return null;

  return {
    sets: Math.max(0, stats.sets ?? 0),
    kills: Math.max(0, stats.kills ?? 0),
    deaths: Math.max(0, stats.deaths ?? 0),
    assists: Math.max(0, stats.assists ?? 0),
    performanceScore: Math.max(0, Math.min(100, stats.performanceScore ?? 0)),
  };
}

function getStarterSeasonSnapshot(state: GameState) {
  const base = SECOND_TEAM_STARTERS[state.player.position];
  const records = (state.player.secondTeamSeason?.matchHistory ?? [])
    .map((record) => ({
      record,
      stats: getRecordedStarterStats(record),
    }))
    .filter((item) => item.stats != null) as {
    record: unknown;
    stats: SecondTeamStarterSeriesStats;
  }[];

  if (records.length === 0) {
    return {
      profile: base,
      games: 0,
      sets: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      recent: [] as SecondTeamStarterSeriesStats[],
    };
  }

  const totals = records.reduce(
    (acc, item) => ({
      sets: acc.sets + item.stats.sets,
      kills: acc.kills + item.stats.kills,
      deaths: acc.deaths + item.stats.deaths,
      assists: acc.assists + item.stats.assists,
    }),
    { sets: 0, kills: 0, deaths: 0, assists: 0 },
  );

  const recent = records.slice(-5).map((item) => item.stats);
  const recentTotals = recent.reduce(
    (acc, item) => ({
      kills: acc.kills + item.kills,
      deaths: acc.deaths + item.deaths,
      assists: acc.assists + item.assists,
      performance: acc.performance + item.performanceScore,
    }),
    { kills: 0, deaths: 0, assists: 0, performance: 0 },
  );

  const recentKda =
    recentTotals.deaths === 0
      ? recentTotals.kills + recentTotals.assists
      : (recentTotals.kills + recentTotals.assists) / recentTotals.deaths;
  const recentPerformance =
    recent.length > 0 ? recentTotals.performance / recent.length : base.form;

  // 폼은 최근 5시리즈 경기력, 코치 신뢰는 누적 출전과 최근 경기력을 반영한다.
  const form = Math.max(
    35,
    Math.min(95, Math.round(base.form * 0.35 + recentPerformance * 0.65)),
  );
  const coachTrust = Math.max(
    35,
    Math.min(
      95,
      Math.round(
        base.coachTrust +
          (recentPerformance - 65) * 0.22 +
          Math.min(8, totals.sets * 0.35),
      ),
    ),
  );

  return {
    profile: {
      ...base,
      form,
      coachTrust,
      recentKda: Number(recentKda.toFixed(2)),
    },
    games: records.length,
    ...totals,
    recent,
  };
}

export function getSecondTeamStarter(state: GameState) {
  return getStarterSeasonSnapshot(state).profile;
}

export function getSecondTeamStarterSeasonStats(state: GameState) {
  const snapshot = getStarterSeasonSnapshot(state);
  const kda =
    snapshot.deaths === 0
      ? snapshot.kills + snapshot.assists
      : (snapshot.kills + snapshot.assists) / snapshot.deaths;

  return {
    games: snapshot.games,
    sets: snapshot.sets,
    kills: snapshot.kills,
    deaths: snapshot.deaths,
    assists: snapshot.assists,
    kda,
    recentSets: snapshot.recent.reduce((sum, item) => sum + item.sets, 0),
  };
}

export function getSecondTeamCompetition(
  state: GameState,
): SecondTeamCompetitionInfo {
  const starter = getSecondTeamStarter(state);
  const playerOvr = calculateOvr(state.player.stats, state.player.position);

  // 실제 경쟁 점수. 기존 starterCompetition은 "팀 내 입지/훈련 평가"로 계속 활용한다.
  const playerScore = Math.round(
    playerOvr * 0.35 +
      state.player.coachTrust * 0.25 +
      state.player.starterCompetition * 0.25 +
      state.player.condition * 0.1 +
      Math.max(0, 100 - state.player.stress) * 0.05,
  );
  const starterScore = Math.round(
    starter.ovr * 0.4 +
      starter.coachTrust * 0.25 +
      starter.form * 0.25 +
      Math.min(100, starter.recentKda * 15) * 0.1,
  );
  const gap = playerScore - starterScore;

  const status =
    gap >= 8
      ? `${state.player.name} 주전 우세`
      : gap >= 2
        ? `${state.player.name} 근소 우세`
        : gap > -3
          ? "주전 경쟁 접전"
          : gap > -9
            ? `${starter.name} 근소 우세`
            : `${starter.name} 주전 우세`;

  return { starter, playerScore, starterScore, gap, status };
}

export function getSecondTeamMatchRole(state: GameState) {
  if (state.player.careerStage !== "SECOND_TEAM") {
    return {
      role: "BENCH" as SecondTeamMatchRole,
      appearanceChance: 0,
      reason: "2군 로스터 소속이 아닙니다.",
      ...getSecondTeamCompetition(state),
    };
  }

  const competition = getSecondTeamCompetition(state);
  const variation =
    (stableNumber(
      `${state.date}|${state.player.secondTeamSeason.round}|${state.actionSeed}|starter`,
    ) -
      0.5) *
    12;
  const effectiveGap = competition.gap + variation;
  const role: SecondTeamMatchRole = effectiveGap >= 0 ? "PLAY" : "BENCH";
  const appearanceChance = Math.max(
    8,
    Math.min(92, Math.round(50 + competition.gap * 4)),
  );

  return {
    role,
    appearanceChance,
    ...competition,
    reason:
      role === "PLAY"
        ? `${competition.starter.name}과의 주전 경쟁 평가에서 앞서 1세트 선발로 결정됐습니다.`
        : `${competition.starter.name}이 1세트 선발입니다. 주인공은 벤치에서 대기합니다.`,
  };
}

export function decideSecondTeamNextSetRole(
  state: GameState,
  currentPlayerInSet: boolean,
  result: { win: boolean; performanceScore: number },
  nextSetNumber: number,
) {
  const competition = getSecondTeamCompetition(state);
  const variance =
    (stableNumber(
      `${state.date}|${state.player.secondTeamSeason.round}|set-${nextSetNumber}|lineup`,
    ) -
      0.5) *
    8;

  if (currentPlayerInSet) {
    const performanceBoost =
      (result.performanceScore - 65) * 0.45 + (result.win ? 4 : -3);
    const keepScore =
      competition.playerScore +
      performanceBoost -
      competition.starterScore +
      variance;
    const playerInSet = keepScore >= -2;

    return {
      playerInSet,
      starter: competition.starter,
      reason: playerInSet
        ? `${state.player.name}의 ${nextSetNumber - 1}세트 경기력을 반영해 선발을 유지합니다.`
        : `${state.player.name}의 경기력이 기대에 못 미쳐 ${competition.starter.name}이 ${nextSetNumber}세트에 투입됩니다.`,
    };
  }

  // 벤치에서 본 세트의 performanceScore는 실제로 출전한 동일 포지션 주전 NPC의 경기력으로 본다.
  const starterSetScore =
    competition.starterScore +
    (result.performanceScore - 65) * 0.4 +
    (result.win ? 4 : -4);
  const substitutionScore =
    competition.playerScore - starterSetScore + variance;
  const playerInSet = substitutionScore >= -4;

  return {
    playerInSet,
    starter: competition.starter,
    reason: playerInSet
      ? `${competition.starter.name}의 이전 세트 경기력을 검토한 코치진이 ${state.player.name}을 ${nextSetNumber}세트 선발로 투입합니다.`
      : `${competition.starter.name}이 ${nextSetNumber}세트 선발을 유지합니다.`,
  };
}

export function completeObservedSecondTeamMatch(
  state: GameState,
  watchedResult?: {
    win: boolean;
    teamKills?: number;
    enemyKills?: number;
    setWins?: number;
    setLosses?: number;
    starterStats?: SecondTeamStarterSeriesStats;
  },
) {
  const current = refreshRecovery(state);
  const season = current.player.secondTeamSeason;
  const matchInfo = getSecondTeamMatchInfo(current);
  const winChance = Math.max(
    0.28,
    Math.min(0.72, 0.5 + (season.teamPower - matchInfo.opponent.power) * 0.025),
  );
  // 라이브 관전 화면에서 실제로 본 결과가 있으면 그 결과를 그대로 시즌에 반영한다.
  const win =
    watchedResult?.win ??
    stableNumber(
      `${current.date}|${season.round}|${current.actionSeed}|bench-result`,
    ) < winChance;
  const wins = season.wins + (win ? 1 : 0);
  const losses = season.losses + (win ? 0 : 1);
  const games = wins + losses;
  const winRate = games ? wins / games : 0;
  const teamRank = Math.max(
    1,
    Math.min(10, 10 - Math.round(winRate * 6 + wins * 0.35)),
  );
  const setWins = watchedResult?.setWins ?? (win ? 2 : 1);
  const setLosses = watchedResult?.setLosses ?? (win ? 1 : 2);
  const leagueState = applyCompletedLeagueRound(
    current,
    matchInfo.round,
    matchInfo.opponent.name,
    win,
    setWins,
    setLosses,
    watchedResult?.starterStats,
  );
  const realStandings = calculateLeagueStandings(leagueState.results);
  const realTeamRank =
    realStandings.findIndex((row) => row.team === "VORTEX") + 1;
  const record = {
    round: matchInfo.round,
    date: current.date,
    opponentId: matchInfo.opponent.id,
    opponentName: matchInfo.opponent.name,
    opponentPower: matchInfo.opponent.power,
    win,
    kills: 0,
    deaths: 0,
    assists: 0,
    performanceScore: 0,
    playerParticipated: false,
    starterStats: watchedResult?.starterStats,
  };
  const next: GameState = {
    ...current,
    slot: "AFTERNOON",
    actionSeed: current.actionSeed + 283,
    player: {
      ...current.player,
      morningEventCompletedDate: current.date,
      secondTeamSeason: {
        ...season,
        round: season.round + 1,
        wins,
        losses,
        teamRank: realTeamRank || teamRank,
        leagueState,
        matchHistory: [...season.matchHistory, record].slice(-20),
      },
      stamina: Math.max(0, current.player.stamina - 5),
      stress: Math.min(100, current.player.stress + (win ? 0 : 1)),
    },
  };
  const scoreText =
    watchedResult?.teamKills != null && watchedResult?.enemyKills != null
      ? ` · ${watchedResult.teamKills}:${watchedResult.enemyKills}`
      : "";
  return {
    state: next,
    summary: `${matchInfo.opponent.name}전 ${win ? "승리" : "패배"}${scoreText}. 벤치에서 풀타임으로 경기를 지켜봤습니다.`,
  };
}

const LEAGUE_TEAM_META: Record<
  SecondTeamLeagueTeamId,
  { name: string; power: number }
> = {
  VORTEX: { name: "VORTEX 2군", power: 66 },
  NOVA: { name: "NOVA 2군", power: 61 },
  RAVEN: { name: "RAVEN 2군", power: 65 },
  APEX: { name: "APEX 2군", power: 68 },
  ZERO: { name: "ZERO 2군", power: 63 },
  ORBIT: { name: "ORBIT 2군", power: 70 },
  TITAN: { name: "TITAN 2군", power: 72 },
  PULSE: { name: "PULSE 2군", power: 64 },
  ECLIPSE: { name: "ECLIPSE 2군", power: 69 },
  PHANTOM: { name: "PHANTOM 2군", power: 67 },
};

const LEAGUE_TEAM_IDS = Object.keys(
  LEAGUE_TEAM_META,
) as SecondTeamLeagueTeamId[];
const VORTEX_FIRST_HALF: SecondTeamLeagueTeamId[] = [
  "NOVA",
  "RAVEN",
  "APEX",
  "ZERO",
  "ORBIT",
  "TITAN",
  "PULSE",
  "ECLIPSE",
  "PHANTOM",
];

function teamIdFromDisplayName(name: string): SecondTeamLeagueTeamId {
  const normalized = name.replace(" 2군", "").toUpperCase();
  return (LEAGUE_TEAM_IDS.find((id) => id === normalized) ??
    "NOVA") as SecondTeamLeagueTeamId;
}

function getSecondTeamLeagueState(state: GameState): SecondTeamLeagueState {
  const raw = state.player.secondTeamSeason.leagueState;
  if (raw?.teams?.length === 10) {
    return {
      results: raw.results ?? [],
      teams: raw.teams.map((t) => ({
        ...t,
        roster: t.roster.map((p) => ({ ...p })),
      })),
    };
  }
  return { results: raw?.results ?? [], teams: createSecondTeamLeagueTeams() };
}

function getLeagueTeam(
  league: SecondTeamLeagueState,
  id: SecondTeamLeagueTeamId,
) {
  return league.teams.find((team) => team.id === id)!;
}

function getPlayerEffectivePower(player: SecondTeamLeaguePlayer) {
  return (
    player.ovr * 0.58 +
    player.form * 0.14 +
    player.morale * 0.08 +
    player.stamina * 0.06 +
    player.synergy * 0.08 +
    player.coachTrust * 0.06
  );
}

function getLivingTeamPower(team: ReturnType<typeof getLeagueTeam>) {
  const starters = team.roster.filter((p) => p.starter);
  const source = starters.length >= 5 ? starters : team.roster.slice(0, 5);
  const pp =
    source.reduce((sum, p) => sum + getPlayerEffectivePower(p), 0) /
    Math.max(1, source.length);
  return pp * 0.82 + team.synergy * 0.1 + team.form * 0.08;
}

function evolveLeaguePlayer(
  player: SecondTeamLeaguePlayer,
  performance: number,
  won: boolean,
  sets: number,
) {
  const xp =
    player.seasonXp +
    Math.max(4, Math.round((performance - 45) * 0.45 + sets * 4));
  const threshold = Math.max(70, 155 - player.potential);
  const grow = player.ovr < player.potential && xp >= threshold;
  return {
    ...player,
    ovr: player.ovr + (grow ? 1 : 0),
    seasonXp: grow ? xp - threshold : xp,
    form: Math.round(
      player.form * 0.68 +
        Math.max(35, Math.min(95, performance + (won ? 3 : -2))) * 0.32,
    ),
    morale: Math.max(
      30,
      Math.min(
        100,
        player.morale +
          (won ? 3 : -3) +
          (performance >= 75 ? 2 : performance < 55 ? -2 : 0),
      ),
    ),
    stamina: Math.max(45, Math.min(100, player.stamina - sets * 5 + 7)),
    hotStreak: performance >= 72 ? player.hotStreak + 1 : 0,
    coldStreak: performance < 56 ? player.coldStreak + 1 : 0,
    coachTrust: Math.max(
      35,
      Math.min(
        95,
        player.coachTrust +
          (performance >= 75 ? 2 : performance < 52 ? -2 : won ? 1 : 0),
      ),
    ),
    synergy: Math.max(40, Math.min(100, player.synergy + (won ? 1 : 0))),
  };
}

// 9개 비-VORTEX 팀끼리 9라운드 라운드로빈을 만들면 매 라운드 정확히 한 팀이 bye.
// 그 bye 팀을 해당 라운드 VORTEX 상대로 매칭하면 10팀 완전 라운드로빈이 된다.
function createFirstHalfLeagueRounds() {
  const nonVortex = VORTEX_FIRST_HALF.slice();
  const withBye: (SecondTeamLeagueTeamId | "BYE")[] = [...nonVortex, "BYE"];
  const rounds: { a: SecondTeamLeagueTeamId; b: SecondTeamLeagueTeamId }[][] =
    [];

  for (let rawRound = 0; rawRound < 9; rawRound += 1) {
    const pairs: { a: SecondTeamLeagueTeamId; b: SecondTeamLeagueTeamId }[] =
      [];
    let byeTeam: SecondTeamLeagueTeamId | null = null;

    for (let i = 0; i < withBye.length / 2; i += 1) {
      const left = withBye[i];
      const right = withBye[withBye.length - 1 - i];
      if (left === "BYE") byeTeam = right as SecondTeamLeagueTeamId;
      else if (right === "BYE") byeTeam = left as SecondTeamLeagueTeamId;
      else
        pairs.push({
          a: left as SecondTeamLeagueTeamId,
          b: right as SecondTeamLeagueTeamId,
        });
    }

    if (byeTeam) pairs.unshift({ a: "VORTEX", b: byeTeam });
    rounds.push(pairs);

    const fixed = withBye[0];
    const rest = withBye.slice(1);
    rest.unshift(rest.pop()!);
    withBye.splice(0, withBye.length, fixed, ...rest);
  }

  // Circle method의 bye 순서 대신 기존 VORTEX 일정 순서를 보존한다.
  // 각 round에서 VORTEX 상대가 원하는 상대가 되도록 round 자체를 재정렬한다.
  return VORTEX_FIRST_HALF.map((opponent) => {
    const found = rounds.find((round) =>
      round.some(
        (pair) =>
          (pair.a === "VORTEX" && pair.b === opponent) ||
          (pair.b === "VORTEX" && pair.a === opponent),
      ),
    );
    return found ?? [];
  });
}

const FIRST_HALF_LEAGUE_ROUNDS = createFirstHalfLeagueRounds();

function getLeagueRoundPairs(round: number) {
  const normalized = Math.max(1, Math.min(18, round));
  if (normalized <= 9) return FIRST_HALF_LEAGUE_ROUNDS[normalized - 1];

  // 기존 VORTEX 일정은 후반 9경기가 전반 상대의 역순이다.
  // 10R=PHANTOM, 11R=ECLIPSE ... 18R=NOVA 순서를 그대로 맞춘다.
  const secondHalfIndex = 18 - normalized;
  return FIRST_HALF_LEAGUE_ROUNDS[secondHalfIndex].map((pair) => ({
    a: pair.b,
    b: pair.a,
  }));
}

function simulateNpcSeries(
  state: GameState,
  league: SecondTeamLeagueState,
  round: number,
  teamA: SecondTeamLeagueTeamId,
  teamB: SecondTeamLeagueTeamId,
): SecondTeamLeagueMatchResult {
  const powerA = getLivingTeamPower(getLeagueTeam(league, teamA));
  const powerB = getLivingTeamPower(getLeagueTeam(league, teamB));
  const roll = stableNumber(
    `${state.player.secondTeamSeason.year ?? 2027}|${state.player.secondTeamSeason.split ?? "SPRING"}|R${round}|${teamA}|${teamB}|result`,
  );
  const chanceA = Math.max(
    0.16,
    Math.min(0.84, 0.5 + (powerA - powerB) * 0.045),
  );
  const winner = roll < chanceA ? teamA : teamB;
  const loser = winner === teamA ? teamB : teamA;
  const sweepChance = Math.max(
    0.34,
    Math.min(0.68, 0.44 + Math.abs(powerA - powerB) * 0.025),
  );
  const loserSets =
    stableNumber(`R${round}|${winner}|${loser}|sets`) < sweepChance ? 0 : 1;
  return {
    round,
    teamA,
    teamB,
    winner,
    teamASets: winner === teamA ? 2 : loserSets,
    teamBSets: winner === teamB ? 2 : loserSets,
  };
}

function applySeriesToLivingRosters(
  league: SecondTeamLeagueState,
  result: SecondTeamLeagueMatchResult,
  playerPosition?: Position,
  vortexStarterStats?: SecondTeamStarterSeriesStats,
): SecondTeamLeagueState {
  const seriesSets = result.teamASets + result.teamBSets;
  return {
    ...league,
    teams: league.teams.map((team) => {
      if (team.id !== result.teamA && team.id !== result.teamB) return team;
      const won = result.winner === team.id;
      const roster = team.roster.map((player) => {
        if (!player.starter)
          return { ...player, stamina: Math.min(100, player.stamina + 4) };
        const isVortexSamePosition =
          team.id === "VORTEX" && player.position === playerPosition;
        if (isVortexSamePosition && !vortexStarterStats) {
          return { ...player, stamina: Math.min(100, player.stamina + 4) };
        }
        const sets = isVortexSamePosition
          ? vortexStarterStats!.sets
          : seriesSets;
        const seed = `${result.round}|${team.id}|${player.position}|${player.id}`;
        const kb =
          player.position === "BOT"
            ? 3.6
            : player.position === "MID"
              ? 3.1
              : player.position === "JUNGLE"
                ? 2.4
                : player.position === "TOP"
                  ? 2.2
                  : 0.7;
        const ab =
          player.position === "SUPPORT"
            ? 6.2
            : player.position === "JUNGLE"
              ? 5
              : 3.5;
        const swing = (player.ovr - 62) * 0.055 + (player.form - 70) * 0.025;
        const kills = isVortexSamePosition
          ? vortexStarterStats!.kills
          : Math.max(
              0,
              Math.round(
                sets *
                  (kb +
                    swing +
                    stableNumber(seed + "|k") * 2 +
                    (won ? 0.55 : -0.2)),
              ),
            );
        const deaths = isVortexSamePosition
          ? vortexStarterStats!.deaths
          : Math.max(
              1,
              Math.round(
                sets *
                  (1.45 +
                    stableNumber(seed + "|d") * 1.55 +
                    (won ? -0.2 : 0.4)),
              ),
            );
        const assists = isVortexSamePosition
          ? vortexStarterStats!.assists
          : Math.max(
              0,
              Math.round(
                sets *
                  (ab +
                    swing * 0.7 +
                    stableNumber(seed + "|a") * 2.8 +
                    (won ? 0.7 : 0)),
              ),
            );
        const kda = (kills + assists) / Math.max(1, deaths);
        const performance = isVortexSamePosition
          ? vortexStarterStats!.performanceScore
          : Math.max(
              35,
              Math.min(
                95,
                Math.round(
                  54 +
                    kda * 4.3 +
                    (won ? 8 : -5) +
                    (stableNumber(seed + "|perf") - 0.5) * 12,
                ),
              ),
            );
        const e = evolveLeaguePlayer(player, performance, won, sets);
        return {
          ...e,
          games: player.games + 1,
          sets: player.sets + sets,
          kills: player.kills + kills,
          deaths: player.deaths + deaths,
          assists: player.assists + assists,
          performanceTotal: player.performanceTotal + performance,
          lastPerformance: performance,
        };
      });
      const starters = roster.filter((p) => p.starter);
      const avg =
        starters.reduce((sum, p) => sum + p.lastPerformance, 0) /
        Math.max(1, starters.length);
      return {
        ...team,
        roster,
        form: Math.max(
          40,
          Math.min(95, Math.round(team.form * 0.72 + avg * 0.28)),
        ),
        synergy: Math.max(45, Math.min(100, team.synergy + (won ? 1 : -1))),
      };
    }),
  };
}

function applyCompletedLeagueRound(
  state: GameState,
  round: number,
  vortexOpponentName: string,
  vortexWin: boolean,
  vortexSetWins: number,
  vortexSetLosses: number,
  vortexStarterStats?: SecondTeamStarterSeriesStats,
) {
  const league = getSecondTeamLeagueState(state);
  if (league.results.some((result) => result.round === round)) return league;

  const opponent = teamIdFromDisplayName(vortexOpponentName);
  const scheduledPairs = getLeagueRoundPairs(round);
  const vortexPair = scheduledPairs.find(
    (pair) => pair.a === "VORTEX" || pair.b === "VORTEX",
  );
  const vortexTeamA = vortexPair?.a ?? "VORTEX";
  const vortexTeamB = vortexPair?.b ?? opponent;
  const winner: SecondTeamLeagueTeamId = vortexWin ? "VORTEX" : opponent;

  const vortexResult: SecondTeamLeagueMatchResult = {
    round,
    teamA: vortexTeamA,
    teamB: vortexTeamB,
    winner,
    teamASets: vortexTeamA === "VORTEX" ? vortexSetWins : vortexSetLosses,
    teamBSets: vortexTeamB === "VORTEX" ? vortexSetWins : vortexSetLosses,
  };

  let livingLeague: SecondTeamLeagueState = {
    ...league,
    teams: league.teams.map((team) => ({
      ...team,
      roster: team.roster.map((p) => ({
        ...p,
        stamina: Math.min(100, p.stamina + 3),
      })),
    })),
  };
  livingLeague = applySeriesToLivingRosters(
    livingLeague,
    vortexResult,
    state.player.position,
    vortexStarterStats,
  );
  const newResults: SecondTeamLeagueMatchResult[] = [vortexResult];

  for (const pair of scheduledPairs) {
    if (pair.a === "VORTEX" || pair.b === "VORTEX") continue;
    const simulated = simulateNpcSeries(
      state,
      livingLeague,
      round,
      pair.a,
      pair.b,
    );
    newResults.push(simulated);
    livingLeague = applySeriesToLivingRosters(livingLeague, simulated);
  }

  return { ...livingLeague, results: [...league.results, ...newResults] };
}

function calculateLeagueStandings(results: SecondTeamLeagueMatchResult[]) {
  const table = new Map<
    SecondTeamLeagueTeamId,
    { wins: number; losses: number; setWins: number; setLosses: number }
  >();
  LEAGUE_TEAM_IDS.forEach((team) =>
    table.set(team, { wins: 0, losses: 0, setWins: 0, setLosses: 0 }),
  );

  results.forEach((result) => {
    const a = table.get(result.teamA)!;
    const b = table.get(result.teamB)!;
    a.setWins += result.teamASets;
    a.setLosses += result.teamBSets;
    b.setWins += result.teamBSets;
    b.setLosses += result.teamASets;
    if (result.winner === result.teamA) {
      a.wins += 1;
      b.losses += 1;
    } else {
      b.wins += 1;
      a.losses += 1;
    }
  });

  const headToHead = (a: SecondTeamLeagueTeamId, b: SecondTeamLeagueTeamId) => {
    const matches = results.filter(
      (result) =>
        (result.teamA === a && result.teamB === b) ||
        (result.teamA === b && result.teamB === a),
    );
    return matches.reduce(
      (score, result) =>
        score + (result.winner === a ? 1 : result.winner === b ? -1 : 0),
      0,
    );
  };

  return LEAGUE_TEAM_IDS.map((team) => {
    const row = table.get(team)!;
    return { team, ...row, setDiff: row.setWins - row.setLosses };
  }).sort(
    (a, b) =>
      b.wins - a.wins ||
      b.setDiff - a.setDiff ||
      headToHead(b.team, a.team) ||
      LEAGUE_TEAM_META[b.team].power - LEAGUE_TEAM_META[a.team].power,
  );
}

export interface LeagueStandingRow {
  rank: number;
  team: string;
  wins: number;
  losses: number;
  winRate: number;
  setWins: number;
  setLosses: number;
  setDiff: number;
  isMyTeam: boolean;
}
export interface KdaRankingRow {
  rank: number;
  name: string;
  team: string;
  position: Position;
  games: number;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  isPlayer: boolean;
}
export interface LaneRankingRow {
  rank: number;
  name: string;
  team: string;
  position: Position;
  score: number;
  isPlayer: boolean;
}

const LEAGUE_TEAMS = [
  "VORTEX 2군",
  "NOVA 2군",
  "RAVEN 2군",
  "APEX 2군",
  "ZERO 2군",
  "ORBIT 2군",
  "TITAN 2군",
  "PULSE 2군",
  "ECLIPSE 2군",
  "PHANTOM 2군",
] as const;
const NPC_NAMES = [
  "KAIN",
  "RUNE",
  "NERO",
  "VEIL",
  "ARC",
  "LUCID",
  "CROW",
  "MAVE",
  "REX",
  "SION",
  "NOAH",
  "JUNE",
  "RAY",
  "DUSK",
  "FATE",
  "LYNX",
  "ROOK",
  "MINT",
  "ZEAL",
  "ONYX",
];

export function getSecondTeamLivingLeague(state: GameState) {
  const league = getSecondTeamLeagueState(state);
  return league.teams.map((team) => ({
    ...team,
    power: Math.round(getLivingTeamPower(team)),
    roster: team.roster.map((player) => ({
      ...player,
      kda: (player.kills + player.assists) / Math.max(1, player.deaths),
      averagePerformance: player.games
        ? player.performanceTotal / player.games
        : player.lastPerformance,
    })),
  }));
}

export function getLeagueDashboard(state: GameState) {
  const league = getSecondTeamLeagueState(state);
  const calculated = calculateLeagueStandings(league.results);

  const standings: LeagueStandingRow[] = calculated.map((row, index) => ({
    rank: index + 1,
    team: LEAGUE_TEAM_META[row.team].name,
    wins: row.wins,
    losses: row.losses,
    winRate: row.wins + row.losses ? row.wins / (row.wins + row.losses) : 0,
    setWins: row.setWins,
    setLosses: row.setLosses,
    setDiff: row.setDiff,
    isMyTeam: row.team === "VORTEX",
  }));

  const livingPlayers = league.teams.flatMap((team) => team.roster);
  const npcKda: KdaRankingRow[] = livingPlayers
    .filter((player) => player.team !== "VORTEX" && player.games > 0)
    .map((player) => ({
      rank: 0,
      name: player.name,
      team: LEAGUE_TEAM_META[player.team].name,
      position: player.position,
      games: player.games,
      kills: player.kills,
      deaths: player.deaths,
      assists: player.assists,
      kda: (player.kills + player.assists) / Math.max(1, player.deaths),
      isPlayer: false,
    }));

  const ps = state.player.seasonStats;
  const kdaRows = [...npcKda];
  if (ps.games > 0) {
    kdaRows.push({
      rank: 0,
      name: state.player.name,
      team: "VORTEX 2군",
      position: state.player.position,
      games: ps.games,
      kills: ps.kills,
      deaths: ps.deaths,
      assists: ps.assists,
      kda: (ps.kills + ps.assists) / Math.max(1, ps.deaths),
      isPlayer: true,
    });
  }

  const kda = kdaRows
    .sort(
      (a, b) =>
        b.kda - a.kda ||
        b.games - a.games ||
        b.kills + b.assists - (a.kills + a.assists),
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const sameLaneNpcs = livingPlayers
    .filter(
      (player) =>
        player.team !== "VORTEX" &&
        player.position === state.player.position &&
        player.games > 0,
    )
    .map((player) => {
      const kda = (player.kills + player.assists) / Math.max(1, player.deaths);
      return {
        rank: 0,
        name: player.name,
        team: LEAGUE_TEAM_META[player.team].name,
        position: player.position,
        score: Math.round(
          45 + Math.min(45, kda * 6) + Math.min(10, player.games * 0.6),
        ),
        isPlayer: false,
      } satisfies LaneRankingRow;
    });

  const playerLaneScore = Math.round(
    calculateOvr(state.player.stats, state.player.position) * 0.55 +
      state.player.coachTrust * 0.2 +
      state.player.starterCompetition * 0.25,
  );
  const lane = [
    ...sameLaneNpcs,
    {
      rank: 0,
      name: state.player.name,
      team: "VORTEX 2군",
      position: state.player.position,
      score: playerLaneScore,
      isPlayer: true,
    },
  ]
    .sort((a, b) => b.score - a.score)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  return {
    standings,
    kda,
    lane,
    completedRounds: new Set(league.results.map((result) => result.round)).size,
  };
}
