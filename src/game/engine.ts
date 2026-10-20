import { ACTIONS } from "../data/actions";
import {
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
  return Math.round(500 * Math.pow(1.035, Math.max(0, stat - 50)));
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

  if (weekday === "SUN") return "REST";

  if (careerStage === "TRAINEE" && weekday === "SAT") return "EVALUATION";
  if (careerStage === "ACADEMY" && weekday === "SAT") return "ACADEMY_MATCH";

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

export function getUpcomingSchedule(state: GameState) {
  if (
    state.player.careerStage === "TRAINEE" &&
    state.player.academyPromotionReady
  ) {
    const weekday = getWeekday(state.date);
    return {
      date: state.date,
      weekday,
      weekdayLabel: weekdayLabels[weekday],
      dayType: "PROMOTION" as const,
      daysAway: 0,
      title: "아카데미 콜업",
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
    if (dayType === "EVALUATION" || dayType === "ACADEMY_MATCH") {
      const weekday = getWeekday(targetDate);
      return {
        date: targetDate,
        weekday,
        weekdayLabel: weekdayLabels[weekday],
        dayType,
        daysAway,
        title: dayType === "EVALUATION" ? "연습생 평가일" : "아카데미 리그",
      };
    }
  }
  return null;
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
    version: 6,
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
      careerStage: "TRAINEE",
      avatar: { ...avatar },
      stats,
      xp,
      stamina: 100,
      condition: 100,
      stress: 0,
      coachTrust: 0,
      starterCompetition: 0,
      seasonStats: {
        games: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
      },
      evaluationHistory: [],
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
  if (raw?.version === 6) {
    return refreshRecovery({
      ...raw,
      player: {
        ...raw.player,
        avatar: normalizeAvatar(raw.player?.avatar),
      },
    });
  }

  // v5 저장 데이터는 선수 평가 필드를 추가해 v6로 올린다.
  if (raw?.version === 5) {
    return refreshRecovery({
      ...raw,
      version: 6,
      player: {
        ...raw.player,
        avatar: normalizeAvatar(raw.player?.avatar),
        coachTrust: raw.player?.coachTrust ?? 0,
        starterCompetition: raw.player?.starterCompetition ?? 0,
        seasonStats: raw.player?.seasonStats ?? {
          games: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
        },
        evaluationHistory: raw.player?.evaluationHistory ?? [],
        academyPromotionReady: raw.player?.academyPromotionReady ?? false,
      },
    });
  }

  // v4 저장 데이터도 바로 v6로 올린다.
  if (raw?.version === 4) {
    return refreshRecovery({
      ...raw,
      version: 6,
      player: {
        ...raw.player,
        avatar: normalizeAvatar(raw.player?.avatar),
        coachTrust: raw.player?.coachTrust ?? 0,
        starterCompetition: raw.player?.starterCompetition ?? 0,
        seasonStats: raw.player?.seasonStats ?? {
          games: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
        },
        evaluationHistory: raw.player?.evaluationHistory ?? [],
        academyPromotionReady: raw.player?.academyPromotionReady ?? false,
      },
    });
  }

  const base = newGame(
    raw?.player?.name ?? "MOON",
    raw?.player?.position ?? "MID",
    normalizeAvatar(raw?.player?.avatar),
  );

  return refreshRecovery({
    ...base,
    ...raw,
    version: 6,
    recovery: raw?.recovery ?? {
      dateKey: koreaDateKey(),
      used: 0,
    },
    player: {
      ...base.player,
      ...raw?.player,
      avatar: normalizeAvatar(raw?.player?.avatar),
      age: raw?.player?.age ?? 17,
      careerStage: "TRAINEE",
      coachTrust: raw?.player?.coachTrust ?? 0,
      starterCompetition: raw?.player?.starterCompetition ?? 0,
      seasonStats: raw?.player?.seasonStats ?? {
        games: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
      },
      evaluationHistory: raw?.player?.evaluationHistory ?? [],
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
  const sleep = ACTIONS.find((a) => a.id === "sleep");

  // 수면은 랜덤 풀에서 제외
  // 명상은 저녁에만 등장
  const dayType = getDayType(state.date, state.player.careerStage);

  const candidates = ACTIONS.filter((a) => {
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

export function promoteToAcademy(state: GameState): GameState {
  if (
    state.player.careerStage !== "TRAINEE" ||
    !state.player.academyPromotionReady
  )
    return state;
  return {
    ...state,
    actionSeed: state.actionSeed + 211,
    player: {
      ...state.player,
      careerStage: "ACADEMY",
      academyPromotionReady: false,
      starterCompetition: Math.max(10, state.player.starterCompetition),
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
  },
): GameState {
  const current = refreshRecovery(state);
  const previous = current.player.seasonStats ?? {
    games: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
  };
  const [year, month, day] = current.date.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day));
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const date = [
    nextDate.getUTCFullYear(),
    String(nextDate.getUTCMonth() + 1).padStart(2, "0"),
    String(nextDate.getUTCDate()).padStart(2, "0"),
  ].join("-");
  return {
    ...current,
    date,
    slot: "MORNING",
    actionSeed: current.actionSeed + 307,
    player: {
      ...current.player,
      seasonStats: {
        games: previous.games + 1,
        kills: previous.kills + result.playerKills,
        deaths: previous.deaths + result.playerDeaths,
        assists: previous.assists + result.playerAssists,
      },
      coachTrust: Math.max(0, current.player.coachTrust + (result.win ? 2 : 0)),
      stamina: Math.max(0, current.player.stamina - 20),
      condition: Math.max(0, current.player.condition - 7),
      stress: Math.min(100, current.player.stress + 4),
    },
  };
}

export function getTraineeRank(state: GameState) {
  const score =
    state.player.coachTrust * 0.45 +
    state.player.starterCompetition * 0.35 +
    calculateOvr(state.player.stats, state.player.position) * 0.2;

  if (score >= 78) return { rank: 1, total: 6 };
  if (score >= 66) return { rank: 2, total: 6 };
  if (score >= 54) return { rank: 3, total: 6 };
  if (score >= 42) return { rank: 4, total: 6 };
  if (score >= 30) return { rank: 5, total: 6 };
  return { rank: 6, total: 6 };
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
      grade: result.grade,
      performanceScore: result.performanceScore,
      win: result.win,
    },
  ].slice(-8);

  const recent = evaluationHistory.slice(-3);
  const recentAverage =
    recent.reduce((sum, item) => sum + item.performanceScore, 0) /
    Math.max(1, recent.length);

  // 최소 3번의 평가를 거쳐야 승격 가능.
  const academyPromotionReady =
    evaluationHistory.length >= 3 &&
    nextCoachTrust >= 55 &&
    nextStarterCompetition >= 55 &&
    recentAverage >= 72;

  const [year, month, day] = current.date.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day));
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  const nextYear = nextDate.getUTCFullYear();
  const nextMonth = String(nextDate.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(nextDate.getUTCDate()).padStart(2, "0");

  return {
    ...current,
    date: `${nextYear}-${nextMonth}-${nextDay}`,
    slot: "MORNING",
    actionSeed: current.actionSeed + 101,
    player: {
      ...current.player,
      coachTrust: nextCoachTrust,
      starterCompetition: nextStarterCompetition,
      evaluationHistory,
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
