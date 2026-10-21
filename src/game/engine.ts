import { ACTIONS } from "../data/actions";
import {
  AcademyRival,
  ActionDef,
  AvatarState,
  DayType,
  GameState,
  Position,
  ScrimGrade,
  SecondTeamCallupCandidate,
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
  for (let daysAway = 0; daysAway <= 28; daysAway++) {
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
        teamRank,
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

function stableNumber(seedText: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

export function getSecondTeamMatchRole(state: GameState) {
  if (state.player.careerStage !== "SECOND_TEAM") {
    return {
      role: "BENCH" as SecondTeamMatchRole,
      appearanceChance: 0,
      reason: "2군 로스터 소속이 아닙니다.",
    };
  }
  const chance = Math.max(
    10,
    Math.min(
      82,
      Math.round(
        10 +
          state.player.starterCompetition * 0.55 +
          state.player.coachTrust * 0.2,
      ),
    ),
  );
  const roll =
    stableNumber(
      `${state.date}|${state.player.secondTeamSeason.round}|${state.actionSeed}|appearance`,
    ) * 100;
  if (roll < chance)
    return {
      role: "PLAY" as SecondTeamMatchRole,
      appearanceChance: chance,
      reason:
        state.player.starterCompetition >= 55
          ? "최근 훈련과 주전 경쟁에서 좋은 평가를 받아 출전 명단에 포함됐습니다."
          : "코치진이 실전 경험을 주기 위해 이번 경기 출전 기회를 부여했습니다.",
    };
  return {
    role: "BENCH" as SecondTeamMatchRole,
    appearanceChance: chance,
    reason:
      state.player.starterCompetition < 35
        ? "아직 주전 경쟁에서 앞선 선수가 있어 이번 경기는 벤치에서 대기합니다."
        : "이번 경기 선발 조합에서 제외됐습니다. 벤치에서 경기를 지켜보며 다음 기회를 준비합니다.",
  };
}

export function completeObservedSecondTeamMatch(
  state: GameState,
  watchedResult?: { win: boolean; teamKills?: number; enemyKills?: number },
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
        teamRank,
        matchHistory: [...season.matchHistory, record].slice(-20),
      },
      stamina: Math.max(0, current.player.stamina - 5),
      stress: Math.min(100, current.player.stress + (win ? 0 : 1)),
      starterCompetition: Math.min(100, current.player.starterCompetition + 1),
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

export interface LeagueStandingRow {
  rank: number;
  team: string;
  wins: number;
  losses: number;
  winRate: number;
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

export function getLeagueDashboard(state: GameState) {
  const season = state.player.secondTeamSeason;
  const playedRounds = Math.max(0, season.round - 1);
  const standings: LeagueStandingRow[] = LEAGUE_TEAMS.map((team) => {
    if (team === "VORTEX 2군")
      return {
        rank: 0,
        team,
        wins: season.wins,
        losses: season.losses,
        winRate:
          season.wins + season.losses
            ? season.wins / (season.wins + season.losses)
            : 0,
        isMyTeam: true,
      };
    const wins =
      playedRounds === 0
        ? 0
        : Math.max(
            0,
            Math.min(
              playedRounds,
              Math.round(
                stableNumber(`${team}|${playedRounds}|standings`) *
                  playedRounds,
              ),
            ),
          );
    return {
      rank: 0,
      team,
      wins,
      losses: playedRounds - wins,
      winRate: playedRounds ? wins / playedRounds : 0,
      isMyTeam: false,
    };
  })
    .sort(
      (a, b) => b.wins - a.wins || a.losses - b.losses || b.winRate - a.winRate,
    )
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const positions: Position[] = ["TOP", "JUNGLE", "MID", "BOT", "SUPPORT"];
  const npcKda: KdaRankingRow[] = NPC_NAMES.slice(0, 15).map((name, i) => {
    const games = Math.max(1, playedRounds),
      deaths = Math.max(
        1,
        Math.round(games * (1.2 + stableNumber(name + "d") * 2.6)),
      );
    const kills = Math.round(games * (1 + stableNumber(name + "k") * 3.8)),
      assists = Math.round(games * (2 + stableNumber(name + "a") * 5.5));
    return {
      rank: 0,
      name,
      team: LEAGUE_TEAMS[(i % 9) + 1],
      position: positions[i % 5],
      games,
      kills,
      deaths,
      assists,
      kda: (kills + assists) / deaths,
      isPlayer: false,
    };
  });
  const ps = state.player.seasonStats;
  const kdaRows = [...npcKda];
  if (ps.games > 0)
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
  const kda = kdaRows
    .sort((a, b) => b.kda - a.kda)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const laneNpc: LaneRankingRow[] = Array.from({ length: 8 }, (_, i) => {
    const name = NPC_NAMES[(i + 3) % NPC_NAMES.length];
    return {
      rank: 0,
      name,
      team: LEAGUE_TEAMS[(i % 9) + 1],
      position: state.player.position,
      score: Math.round(
        58 + stableNumber(`${name}|${state.player.position}|lane`) * 28,
      ),
      isPlayer: false,
    };
  });
  const playerLaneScore = Math.round(
    calculateOvr(state.player.stats, state.player.position) * 0.55 +
      state.player.coachTrust * 0.2 +
      state.player.starterCompetition * 0.25,
  );
  const lane = [
    ...laneNpc,
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
    .map((r, i) => ({ ...r, rank: i + 1 }));
  return { standings, kda, lane };
}
