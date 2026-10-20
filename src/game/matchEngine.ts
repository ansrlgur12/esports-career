import { GameState, ScrimGrade, ScrimResult, StatKey } from "../types/game";

export type ScrimChoice = {
  id: string;
  title: string;
  description: string;
  stats: StatKey[];
  risk: "LOW" | "MEDIUM" | "HIGH";
};

export type ScrimMoment = {
  id: string;
  minute: number;
  title: string;
  situation: string;
  choices: ScrimChoice[];
};

export type ScrimState = {
  minute: number;
  teamKills: number;
  enemyKills: number;
  goldDiff: number;
  playerKills: number;
  playerDeaths: number;
  playerAssists: number;
  momentIndex: number;
  clutchSuccesses: number;
  clutchTotal: number;
  scoreBonus: number;
  finished: boolean;
  result?: ScrimResult;
};

export const SCRIM_MOMENTS: ScrimMoment[] = [
  {
    id: "lane-pressure",
    minute: 9,
    title: "라인 주도권",
    situation:
      "상대가 무리하게 라인을 밀고 있습니다. 정글 위치는 확실하지 않습니다.",
    choices: [
      {
        id: "punish",
        title: "킬각을 본다",
        description: "높은 보상, 높은 위험",
        stats: ["killSense", "physical", "reaction"],
        risk: "HIGH",
      },
      {
        id: "freeze",
        title: "라인을 묶는다",
        description: "CS와 안정성을 챙긴다",
        stats: ["laning", "cs", "decision"],
        risk: "LOW",
      },
      {
        id: "pressure",
        title: "압박 후 시야 확보",
        description: "주도권을 팀에 연결한다",
        stats: ["laning", "vision", "macro"],
        risk: "MEDIUM",
      },
    ],
  },
  {
    id: "dragon-fight",
    minute: 19,
    title: "드래곤 교전",
    situation:
      "양 팀이 드래곤 앞에서 대치 중입니다. 먼저 움직이면 교전을 열 수 있습니다.",
    choices: [
      {
        id: "engage",
        title: "먼저 진입한다",
        description: "한타를 직접 연다",
        stats: ["teamfight", "physical", "decision"],
        risk: "HIGH",
      },
      {
        id: "wait",
        title: "상대 실수를 기다린다",
        description: "안정적인 역공을 노린다",
        stats: ["decision", "mental", "synergy"],
        risk: "LOW",
      },
      {
        id: "flank",
        title: "측면 각을 만든다",
        description: "성공하면 큰 이득",
        stats: ["movement", "vision", "killSense"],
        risk: "MEDIUM",
      },
    ],
  },
  {
    id: "late-clutch",
    minute: 29,
    title: "승부처",
    situation:
      "골드 차이는 크지 않습니다. 이번 교전이 경기의 흐름을 결정할 수 있습니다.",
    choices: [
      {
        id: "carry",
        title: "캐리 각을 노린다",
        description: "개인 기량으로 승부한다",
        stats: ["physical", "teamfight", "focus"],
        risk: "HIGH",
      },
      {
        id: "objective",
        title: "오브젝트를 우선한다",
        description: "운영으로 승기를 잡는다",
        stats: ["macro", "objective", "decision"],
        risk: "MEDIUM",
      },
      {
        id: "team",
        title: "팀 콜에 맞춘다",
        description: "호흡과 안정성을 중시한다",
        stats: ["calling", "synergy", "mental"],
        risk: "LOW",
      },
    ],
  },
];

function rng(seed: number) {
  let t = seed >>> 0;
  t += 0x6d2b79f5;
  let r = Math.imul(t ^ (t >>> 15), 1 | t);
  r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
  return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
}

function averageStats(game: GameState, keys: StatKey[]) {
  return (
    keys.reduce((sum, key) => sum + game.player.stats[key], 0) / keys.length
  );
}

function readiness(game: GameState) {
  return (
    game.player.condition * 0.08 +
    game.player.stamina * 0.04 -
    game.player.stress * 0.035
  );
}

export function createScrim(game: GameState): ScrimState {
  const base = 2 + Math.floor(rng(game.actionSeed + 71) * 3);
  const enemy = 2 + Math.floor(rng(game.actionSeed + 91) * 3);

  return {
    minute: 5,
    teamKills: base,
    enemyKills: enemy,
    goldDiff: (base - enemy) * 320,
    playerKills: 0,
    playerDeaths: 0,
    playerAssists: 1,
    momentIndex: 0,
    clutchSuccesses: 0,
    clutchTotal: 0,
    scoreBonus: 0,
    finished: false,
  };
}

export function currentMoment(state: ScrimState) {
  const moment = SCRIM_MOMENTS[state.momentIndex];
  if (!moment || state.finished) return null;
  return state.minute >= moment.minute ? moment : null;
}

export function advanceScrim(game: GameState, state: ScrimState): ScrimState {
  if (state.finished || currentMoment(state)) return state;

  const nextMoment = SCRIM_MOMENTS[state.momentIndex];
  if (!nextMoment) return finishScrim(game, state);

  const r = rng(game.actionSeed + state.minute * 17 + state.momentIndex * 31);
  const teamDelta = r > 0.52 ? 2 : 1;
  const enemyDelta = r < 0.38 ? 2 : r < 0.72 ? 1 : 0;

  return {
    ...state,
    minute: nextMoment.minute,
    teamKills: state.teamKills + teamDelta,
    enemyKills: state.enemyKills + enemyDelta,
    goldDiff: state.goldDiff + (teamDelta - enemyDelta) * 430,
    playerAssists: state.playerAssists + (teamDelta > 0 ? 1 : 0),
  };
}

export function resolveScrimChoice(
  game: GameState,
  state: ScrimState,
  choice: ScrimChoice,
): { state: ScrimState; success: boolean; chance: number } {
  const statPower = averageStats(game, choice.stats);
  const riskPenalty =
    choice.risk === "HIGH" ? 9 : choice.risk === "MEDIUM" ? 4 : 0;
  const chance = Math.max(
    18,
    Math.min(88, 38 + (statPower - 50) * 0.85 + readiness(game) - riskPenalty),
  );

  const roll =
    rng(
      game.actionSeed +
        state.momentIndex * 997 +
        choice.id.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0),
    ) * 100;

  const success = roll <= chance;
  const highRisk = choice.risk === "HIGH";

  let next: ScrimState = {
    ...state,
    clutchTotal: state.clutchTotal + 1,
    momentIndex: state.momentIndex + 1,
    minute: state.minute + 2,
  };

  if (success) {
    next = {
      ...next,
      teamKills: next.teamKills + (highRisk ? 3 : 2),
      enemyKills: next.enemyKills + (choice.risk === "LOW" ? 1 : 0),
      goldDiff: next.goldDiff + (highRisk ? 1450 : 900),
      playerKills: next.playerKills + (highRisk ? 2 : 1),
      playerAssists: next.playerAssists + 1,
      clutchSuccesses: next.clutchSuccesses + 1,
      scoreBonus:
        next.scoreBonus + (highRisk ? 13 : choice.risk === "MEDIUM" ? 10 : 7),
    };
  } else {
    next = {
      ...next,
      enemyKills: next.enemyKills + (highRisk ? 3 : 2),
      goldDiff: next.goldDiff - (highRisk ? 1300 : 750),
      playerDeaths: next.playerDeaths + 1,
      scoreBonus: next.scoreBonus - (highRisk ? 8 : 4),
    };
  }

  if (next.momentIndex >= SCRIM_MOMENTS.length) {
    next.minute = 34;
  }

  return { state: next, success, chance: Math.round(chance) };
}

export function finishScrim(game: GameState, state: ScrimState): ScrimState {
  if (state.finished) return state;

  const core =
    averageStats(game, [
      "laning",
      "decision",
      "teamfight",
      "mental",
      "synergy",
    ]) - 50;
  const kdaScore =
    state.playerKills * 4 + state.playerAssists * 1.5 - state.playerDeaths * 3;
  const performanceScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        58 +
          core * 0.7 +
          kdaScore +
          state.scoreBonus +
          game.player.condition * 0.05,
      ),
    ),
  );

  const finalTeamKills = state.teamKills + (state.goldDiff >= 0 ? 3 : 1);
  const finalEnemyKills = state.enemyKills + (state.goldDiff < 0 ? 3 : 1);
  const win = state.goldDiff + (finalTeamKills - finalEnemyKills) * 250 >= 0;

  let grade: ScrimGrade = "C";
  if (performanceScore >= 92) grade = "S";
  else if (performanceScore >= 84) grade = "A+";
  else if (performanceScore >= 76) grade = "A";
  else if (performanceScore >= 68) grade = "B+";
  else if (performanceScore >= 58) grade = "B";

  const coachTrustDelta =
    performanceScore >= 84
      ? 8
      : performanceScore >= 76
        ? 6
        : performanceScore >= 68
          ? 4
          : performanceScore >= 58
            ? 2
            : -1;

  const starterCompetitionDelta =
    performanceScore >= 84
      ? 10
      : performanceScore >= 76
        ? 7
        : performanceScore >= 68
          ? 4
          : performanceScore >= 58
            ? 2
            : 0;

  const strengths =
    state.clutchSuccesses >= 2
      ? ["클러치", "교전 집중력"]
      : state.playerDeaths <= 1
        ? ["안정성", "생존"]
        : ["적극성", "경험"];

  const improvements =
    state.playerDeaths >= 2
      ? ["위험 관리", "생존 판단"]
      : state.clutchSuccesses === 0
        ? ["승부처 판단", "한타"]
        : ["오브젝트 판단", "팀 호흡"];

  const coachComment =
    performanceScore >= 84
      ? "중요한 순간에 확실한 존재감을 보여줬다. 다음 평가에서도 이 경기력을 유지해라."
      : performanceScore >= 76
        ? "전반적으로 좋은 경기였다. 몇 가지 판단만 다듬으면 더 높은 단계에서도 경쟁할 수 있다."
        : performanceScore >= 68
          ? "가능성은 확인했다. 다만 승부처에서 더 안정적인 판단이 필요하다."
          : "아직 1군 경쟁을 논하기엔 부족하다. 기본기와 팀 플레이부터 다시 점검하자.";

  return {
    ...state,
    minute: 36,
    teamKills: finalTeamKills,
    enemyKills: finalEnemyKills,
    finished: true,
    result: {
      win,
      playerKills: state.playerKills,
      playerDeaths: state.playerDeaths,
      playerAssists: state.playerAssists,
      teamKills: finalTeamKills,
      enemyKills: finalEnemyKills,
      goldDiff: state.goldDiff,
      clutchSuccesses: state.clutchSuccesses,
      clutchTotal: state.clutchTotal,
      performanceScore,
      grade,
      coachTrustDelta,
      starterCompetitionDelta,
      strengths,
      improvements,
      coachComment,
    },
  };
}
