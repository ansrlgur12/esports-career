import { ACTIONS } from "../data/actions";
import {
  AcademyCallupCandidate,
  ActionDef,
  AvatarState,
  DayType,
  GameState,
  Position,
  ScrimGrade,
  StatKey,
  Stats,
  StatXp,
  TimeSlot,
  TraineeRival,
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
 * 연습생 단계의 기본 주간 일정.
 *
 * 월~금: 일반 훈련
 * 토: 평가일 (향후 평가전/코치 평가 시스템 연결)
 * 일: 회복일
 */
export function getDayType(
  date: string,
  careerStage: GameState["player"]["careerStage"],
): DayType {
  const weekday = getWeekday(date);
  const dayOfMonth = Number(date.slice(8, 10));

  if (weekday === "SUN") return "REST";

  if (careerStage === "ACADEMY") {
    // 아카데미 월간 평가는 매월 첫 번째 월요일 1회.
    if (weekday === "MON" && dayOfMonth <= 7) return "EVALUATION";

    // 아카데미 정기 스크림은 수요일/토요일.
    if (weekday === "WED" || weekday === "SAT") return "SCRIM";
  }

  // 2군부터 토요일 공식 리그 경기.
  if (careerStage === "SECOND_TEAM" && weekday === "SAT")
    return "ACADEMY_MATCH";

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

export const ACADEMY_OPPONENTS = [
  { id: "nova", name: "NOVA ACADEMY", power: 61 },
  { id: "raven", name: "RAVEN ACADEMY", power: 65 },
  { id: "apex", name: "APEX ACADEMY", power: 68 },
  { id: "zero", name: "ZERO ACADEMY", power: 63 },
  { id: "orbit", name: "ORBIT ACADEMY", power: 70 },
  { id: "vortex", name: "VORTEX ACADEMY", power: 66 },
  { id: "titan", name: "TITAN ACADEMY", power: 72 },
  { id: "pulse", name: "PULSE ACADEMY", power: 64 },
  { id: "eclipse", name: "ECLIPSE ACADEMY", power: 69 },
] as const;

export function getAcademyMatchInfo(state: GameState) {
  const season = state.player.academySeason ?? {
    round: 1,
    wins: 0,
    losses: 0,
    teamRank: 5,
    teamPower: 64,
    firstTeamInterest: 0,
    matchHistory: [],
  };
  const opponent =
    ACADEMY_OPPONENTS[(season.round - 1) % ACADEMY_OPPONENTS.length];
  return {
    round: season.round,
    opponent,
    teamPower: season.teamPower,
  };
}

export function getUpcomingSchedule(state: GameState) {
  if (
    state.player.careerStage === "ACADEMY" &&
    state.player.academyPromotionReady
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
  for (let daysAway = 0; daysAway <= 14; daysAway++) {
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
      dayType === "ACADEMY_MATCH"
    ) {
      const weekday = getWeekday(targetDate);
      const academy = getAcademyMatchInfo(state);
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
              : `아카데미 리그 ${academy.round}R vs ${academy.opponent.name}`,
      };
    }
  }
  return null;
}

function createTraineeRivals(position: Position): TraineeRival[] {
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

function rivalScore(rival: TraineeRival) {
  return (
    rival.evaluationScore * 0.35 +
    rival.scrimRating * 0.25 +
    rival.ovr * 0.25 +
    rival.coachRating * 0.15
  );
}

function playerCompetitionScore(state: GameState) {
  const evals = state.player.evaluationHistory ?? [];
  const scrims = state.player.traineeScrimHistory ?? [];
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

export function getTraineeStandings(state: GameState) {
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
    ...(state.player.traineeRivals ?? []).map((rival) => ({
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
  return getTraineeStandings(state).filter(
    (row) => row.position === state.player.position,
  );
}

export function getAcademyCallupCandidates(
  state: GameState,
): AcademyCallupCandidate[] {
  const standings = getTraineeStandings(state);
  const positionGroups = new Map<Position, typeof standings>();

  for (const row of standings) {
    const group = positionGroups.get(row.position) ?? [];
    group.push(row);
    positionGroups.set(row.position, group);
  }

  const candidates: AcademyCallupCandidate[] = [];

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
  rivals: TraineeRival[],
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
    const next: TraineeRival = {
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
      academySeason: {
        round: 1,
        wins: 0,
        losses: 0,
        teamRank: 5,
        teamPower: 64,
        firstTeamInterest: 0,
        matchHistory: [],
      },
      evaluationHistory: [],
      traineeScrimHistory: [],
      traineeRivals: createTraineeRivals(position),
      academyPromotionReady: false,
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

  const academySeason = {
    round: raw?.player?.academySeason?.round ?? seasonStats.games + 1,
    wins: raw?.player?.academySeason?.wins ?? 0,
    losses: raw?.player?.academySeason?.losses ?? 0,
    teamRank: raw?.player?.academySeason?.teamRank ?? 5,
    teamPower: raw?.player?.academySeason?.teamPower ?? 64,
    firstTeamInterest: raw?.player?.academySeason?.firstTeamInterest ?? 0,
    matchHistory: raw?.player?.academySeason?.matchHistory ?? [],
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
      academySeason,
      evaluationHistory: raw?.player?.evaluationHistory ?? [],
      traineeScrimHistory: raw?.player?.traineeScrimHistory ?? [],
      traineeRivals:
        raw?.player?.traineeRivals ??
        createTraineeRivals(raw?.player?.position ?? "MID"),
      academyPromotionReady: raw?.player?.academyPromotionReady ?? false,
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

export function completeTraineeScrim(
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
  const traineeScrimHistory = [
    ...(current.player.traineeScrimHistory ?? []),
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
      traineeScrimHistory,
      morningEventCompletedDate: current.date,
      traineeRivals: simulateRivals(
        current.player.traineeRivals ?? [],
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
    !state.player.academyPromotionReady
  ) {
    return state;
  }

  return {
    ...state,
    actionSeed: state.actionSeed + 211,
    player: {
      ...state.player,
      careerStage: "SECOND_TEAM",
      academyPromotionReady: false,
      annualSalary: Math.max(state.player.annualSalary ?? 24000000, 36000000),
      starterCompetition: Math.max(10, state.player.starterCompetition),
      seasonStats: { games: 0, kills: 0, deaths: 0, assists: 0 },
      academySeason: {
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

export function completeAcademyMatch(
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
  const season = current.player.academySeason ?? {
    round: previous.games + 1,
    wins: 0,
    losses: 0,
    teamRank: 5,
    teamPower: 64,
    firstTeamInterest: 0,
    matchHistory: [],
  };
  const matchInfo = getAcademyMatchInfo(current);

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
      academySeason: {
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

export function getTraineeRank(state: GameState) {
  const standings = getTraineeStandings(state);
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

function getTraineeRankFromValues(
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

export function completeTraineeEvaluation(
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

  const recentScrims = (current.player.traineeScrimHistory ?? []).slice(-8);
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

  const rankBefore = getTraineeRank(current).rank;
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
    current.player.traineeRivals ?? [],
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
      traineeRivals: nextRivals,
    },
  };

  // 실제 전체/포지션 경쟁 순위를 다시 계산한다.
  const rankAfter = getTraineeRank(rankState).rank;
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
          ? `${current.player.position} 연습생 경쟁 1위를 지켰습니다.`
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

  const academyPromotionReady =
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
      traineeRivals: nextRivals,
      academyPromotionReady,
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
