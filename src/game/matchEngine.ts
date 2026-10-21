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
  commentary: string[];
  commentaryIndex: number;
  commentaryLog: { minute: number; second: number; text: string }[];
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

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomSecond(): number {
  return Math.floor(Math.random() * 60);
}

function scoreContext(teamKills: number, enemyKills: number) {
  const diff = teamKills - enemyKills;
  if (diff >= 3) return "AHEAD";
  if (diff <= -3) return "BEHIND";
  return "EVEN";
}

function buildCommentary(
  game: GameState,
  momentIndex: number,
  teamKills: number,
  enemyKills: number,
): string[] {
  const position = game.player.position;
  const context = scoreContext(teamKills, enemyKills);
  const otherLane =
    position === "BOT" || position === "SUPPORT"
      ? pick(["탑", "미드"])
      : pick(["바텀", "탑"]);

  const opening = [
    "양 팀이 라인에 도착했습니다. 아직은 서로 간을 보는 모습입니다.",
    "초반 라인전이 시작됩니다. 양 팀 모두 무리하지 않고 CS를 챙깁니다.",
    "정글러들이 첫 동선을 시작합니다. 아직 큰 충돌은 없습니다.",
    "라인전 시작. 초반 주도권을 잡기 위한 견제가 오갑니다.",
  ];

  const neutral = [
    `${otherLane}에서 강한 견제가 들어갑니다. 체력 교환이 꽤 크게 일어났습니다.`,
    `${otherLane} 쪽 시야가 지워집니다. 정글 개입 가능성을 경계해야 합니다.`,
    "강가에서 양 팀 정글러가 마주쳤지만 일단 서로 물러납니다.",
    "상대가 라인을 빠르게 밀어 넣습니다. 다음 움직임을 준비하는 모습입니다.",
    "귀환 타이밍이 엇갈립니다. 잠시 라인 주도권이 흔들립니다.",
    "정글 시야가 사라졌습니다. 각 라인이 조금씩 뒤로 물러섭니다.",
  ];

  const ahead = [
    "우리 팀이 주도권을 잡고 상대 정글 시야까지 밀어냅니다.",
    "킬 우위를 바탕으로 우리 팀이 먼저 오브젝트 지역을 장악합니다.",
    "상대가 정면 교전을 피합니다. 우리 팀이 라인을 깊게 밀어 넣습니다.",
    "우리 팀이 템포를 올립니다. 상대는 시야를 확보하는 것조차 부담스럽습니다.",
    "사이드 라인에서도 우리 팀이 압박을 이어갑니다.",
  ];

  const behind = [
    "상대 팀이 킬 우위를 바탕으로 강가 시야를 먼저 장악합니다.",
    "우리 팀이 정면 충돌을 피하며 라인을 받아먹습니다.",
    "상대의 압박이 거셉니다. 시야를 확인하지 않고 들어가기 어려운 상황입니다.",
    "우리 팀이 손해를 최소화하며 다음 교전 기회를 기다립니다.",
    "상대가 오브젝트 주변을 먼저 차지합니다. 진입 경로가 좁아집니다.",
  ];

  const fight = [
    `${otherLane}에서 교전 발생! 양쪽 모두 빠르게 합류합니다.`,
    `${otherLane}에서 먼저 싸움이 열렸습니다! 체력이 순식간에 빠집니다.`,
    `${otherLane} 쪽에서 갱킹이 들어갑니다. 도주 경로가 막혔습니다!`,
    `강가에서 갑작스러운 교전! 양 팀이 연달아 스킬을 쏟아붓습니다.`,
  ];

  const phasePool =
    context === "AHEAD" ? ahead : context === "BEHIND" ? behind : neutral;

  if (momentIndex === 0) {
    return [
      pick(opening),
      pick(neutral),
      pick(fight),
      pick([
        "첫 킬이 나왔습니다! 초반 균형이 처음으로 흔들립니다.",
        "퍼스트 블러드! 먼저 한 명이 쓰러지며 스코어가 열립니다.",
        "첫 교전에서 킬이 발생합니다. 이제 양 팀의 움직임이 달라집니다.",
      ]),
      pick(neutral),
      `${position}에게도 직접 개입할 수 있는 타이밍이 다가옵니다.`,
    ];
  }

  if (momentIndex === 1) {
    return [
      pick(phasePool),
      pick(neutral),
      pick([
        "첫 번째 주요 오브젝트를 앞두고 양 팀이 강가에 시야를 깔기 시작합니다.",
        "오브젝트 시간이 가까워집니다. 서포터와 정글러의 움직임이 빨라집니다.",
        "양 팀이 귀환 후 장비를 갖춥니다. 다음 교전을 준비하는 타이밍입니다.",
      ]),
      pick(fight),
      context === "AHEAD"
        ? `${position}이 합류하면 우위를 더 크게 벌릴 수 있는 상황입니다.`
        : context === "BEHIND"
          ? `${position}의 판단 하나로 불리한 흐름을 끊을 수 있는 상황입니다.`
          : `${position}의 합류 판단이 다음 교전의 핵심이 될 수 있습니다.`,
    ];
  }

  return [
    pick(phasePool),
    pick([
      "사이드 웨이브를 정리한 선수들이 하나둘 중앙으로 모입니다.",
      "양 팀이 시야를 지우며 상대의 위치를 확인하려 합니다.",
      "한 명이라도 잘리면 큰 오브젝트로 이어질 수 있는 시간대입니다.",
      "라인을 밀어 넣은 뒤 양 팀 모두 중앙 지역으로 움직입니다.",
    ]),
    pick(phasePool),
    pick(fight),
    context === "AHEAD"
      ? "우리 팀이 먼저 자리를 잡았습니다. 이번 교전으로 승기를 굳힐 수 있습니다."
      : context === "BEHIND"
        ? "상대가 먼저 자리를 잡았습니다. 역전하려면 정확한 진입 판단이 필요합니다."
        : "팽팽한 상황입니다. 이번 교전이 경기의 흐름을 결정할 가능성이 큽니다.",
  ];
}

export function createScrim(game: GameState): ScrimState {
  return {
    minute: 0,
    teamKills: 0,
    enemyKills: 0,
    goldDiff: 0,
    playerKills: 0,
    playerDeaths: 0,
    playerAssists: 0,
    momentIndex: 0,
    clutchSuccesses: 0,
    clutchTotal: 0,
    scoreBonus: 0,
    finished: false,
    commentary: buildCommentary(game, 0, 0, 0),
    commentaryIndex: 0,
    commentaryLog: [
      {
        minute: 0,
        second: 0,
        text: "경기가 시작됩니다. 양 팀 모두 조심스럽게 라인전을 준비합니다.",
      },
    ],
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

  // 중계 한 줄씩 자동 진행. 마지막 줄 다음에 클러치 타이밍 진입.
  if (state.commentaryIndex < state.commentary.length - 1) {
    const nextIndex = state.commentaryIndex + 1;
    const progress = (nextIndex + 1) / state.commentary.length;
    const nextMinute = Math.min(
      nextMoment.minute - 1,
      Math.max(state.minute + 1, Math.round(nextMoment.minute * progress)),
    );

    // 주변 라인/NPC 교전 결과를 조금씩 스코어에 반영한다.
    const seed = game.actionSeed + state.momentIndex * 311 + nextIndex * 47;
    const r = rng(seed);
    const scoreEvent = nextIndex === 3 || (nextIndex > 1 && r > 0.78);
    const scoreDiff = state.teamKills - state.enemyKills;
    const ourKillChance = scoreDiff <= -3 ? 0.42 : scoreDiff >= 3 ? 0.58 : 0.5;
    const ourKill = scoreEvent && r >= 1 - ourKillChance;
    const enemyKill = scoreEvent && !ourKill;

    return {
      ...state,
      minute: nextMinute,
      commentaryIndex: nextIndex,
      commentaryLog: [
        ...(state.commentaryLog ?? []),
        {
          minute: nextMinute,
          second: randomSecond(),
          text: state.commentary[nextIndex],
        },
      ],
      teamKills: state.teamKills + (ourKill ? 1 : 0),
      enemyKills: state.enemyKills + (enemyKill ? 1 : 0),
      goldDiff: state.goldDiff + (ourKill ? 320 : enemyKill ? -320 : 0),
    };
  }

  return {
    ...state,
    minute: nextMoment.minute,
    commentaryLog: [
      ...(state.commentaryLog ?? []),
      {
        minute: nextMoment.minute,
        second: randomSecond(),
        text: `중요한 순간입니다. ${nextMoment.title}`,
      },
    ],
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
    next.commentary = [
      "마지막 교전이 끝났습니다. 양 팀이 남은 오브젝트를 정리합니다.",
      "승부가 사실상 결정됩니다. 경기 종료를 준비합니다.",
    ];
    next.commentaryIndex = 0;
  } else {
    next.commentary = buildCommentary(
      game,
      next.momentIndex,
      next.teamKills,
      next.enemyKills,
    );
    next.commentaryIndex = 0;
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
