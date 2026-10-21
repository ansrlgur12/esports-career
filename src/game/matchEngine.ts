import { GameState, ScrimGrade, ScrimResult, StatKey } from "../types/game";

export type ScrimChoice = {
  id: string;
  title: string;
  description: string;
  stats: StatKey[];
  risk: "LOW" | "MEDIUM" | "HIGH";
};

export type ScrimMomentKind =
  | "LANE"
  | "ROAM_TOP"
  | "ROAM_BOT"
  | "CRAB"
  | "HERALD"
  | "DRAGON"
  | "BARON"
  | "PICK"
  | "DIVE"
  | "INVADE"
  | "TEAMFIGHT";

export type ScrimMoment = {
  id: string;
  kind: ScrimMomentKind;
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
  moments: ScrimMoment[];
  endMinute: number;
  teamDragons: number;
  enemyDragons: number;
  dragonSoulOwner: "TEAM" | "ENEMY" | null;
  teamElders: number;
  enemyElders: number;
  teamBarons: number;
  enemyBarons: number;
  teamTowers: number;
  enemyTowers: number;
  clutchSuccesses: number;
  clutchTotal: number;
  scoreBonus: number;
  finished: boolean;
  commentary: string[];
  commentaryIndex: number;
  commentaryLog: { minute: number; second: number; text: string }[];
  result?: ScrimResult;
};

const MOMENT_TEMPLATES: Record<
  ScrimMomentKind,
  Omit<ScrimMoment, "id" | "minute">[]
> = {
  LANE: [
    {
      kind: "LANE",
      title: "라인 압박",
      situation:
        "상대가 체력이 빠진 채 라인에 남아 있습니다. 정글 위치는 아직 보이지 않습니다.",
      choices: [
        {
          id: "lane-kill",
          title: "킬각을 본다",
          description: "라인에서 직접 격차를 벌린다",
          stats: ["killSense", "physical", "reaction"],
          risk: "HIGH",
        },
        {
          id: "lane-freeze",
          title: "웨이브를 묶는다",
          description: "상대를 라인에 가둔다",
          stats: ["laning", "cs", "decision"],
          risk: "LOW",
        },
        {
          id: "lane-reset",
          title: "밀고 먼저 귀환",
          description: "템포와 다음 턴을 챙긴다",
          stats: ["laning", "macro", "decision"],
          risk: "MEDIUM",
        },
      ],
    },
  ],
  ROAM_TOP: [
    {
      kind: "ROAM_TOP",
      title: "탑 로밍 기회",
      situation:
        "탑 라인이 길게 밀려 있고 상대 탑은 점멸이 없습니다. 지금 움직이면 수적 우위를 만들 수 있습니다.",
      choices: [
        {
          id: "top-roam",
          title: "탑으로 바로 뛴다",
          description: "웨이브 일부를 포기하고 킬을 노린다",
          stats: ["macro", "movement", "killSense"],
          risk: "MEDIUM",
        },
        {
          id: "top-cover",
          title: "정글과 함께 진입",
          description: "느리지만 성공률을 높인다",
          stats: ["synergy", "vision", "decision"],
          risk: "LOW",
        },
        {
          id: "top-fake",
          title: "로밍 척하고 복귀",
          description: "상대 시야와 텔레포트를 흔든다",
          stats: ["macro", "calling", "laning"],
          risk: "MEDIUM",
        },
      ],
    },
  ],
  ROAM_BOT: [
    {
      kind: "ROAM_BOT",
      title: "바텀 로밍 기회",
      situation:
        "바텀에서 긴 교환이 이어져 양쪽 체력이 낮습니다. 먼저 합류하면 전투를 끝낼 수 있습니다.",
      choices: [
        {
          id: "bot-roam",
          title: "바텀으로 즉시 합류",
          description: "빠른 숫자 우위로 킬을 노린다",
          stats: ["movement", "macro", "killSense"],
          risk: "MEDIUM",
        },
        {
          id: "bot-dive",
          title: "다이브까지 본다",
          description: "성공하면 큰 이득, 실패하면 역전",
          stats: ["teamfight", "decision", "physical"],
          risk: "HIGH",
        },
        {
          id: "bot-river",
          title: "강가 시야부터 잡는다",
          description: "안전하게 다음 드래곤 턴을 준비한다",
          stats: ["vision", "objective", "macro"],
          risk: "LOW",
        },
      ],
    },
  ],
  CRAB: [
    {
      kind: "CRAB",
      title: "바위게 싸움",
      situation:
        "강가 바위게를 두고 양 팀 정글러가 마주쳤습니다. 가까운 라인이 먼저 움직일 수 있습니다.",
      choices: [
        {
          id: "crab-first",
          title: "먼저 강가로 붙는다",
          description: "주도권을 이용해 싸움을 연다",
          stats: ["movement", "synergy", "reaction"],
          risk: "MEDIUM",
        },
        {
          id: "crab-zone",
          title: "상대 합류를 막는다",
          description: "정글러가 바위게를 먹게 공간을 만든다",
          stats: ["laning", "decision", "teamfight"],
          risk: "LOW",
        },
        {
          id: "crab-trade",
          title: "반대편 이득을 본다",
          description: "싸움을 버리고 라인/정글 이득을 교환한다",
          stats: ["macro", "cs", "decision"],
          risk: "LOW",
        },
      ],
    },
  ],
  HERALD: [
    {
      kind: "HERALD",
      title: "전령 싸움",
      situation:
        "전령 체력이 빠르게 줄고 있습니다. 상대도 강가 위쪽으로 인원을 모으는 중입니다.",
      choices: [
        {
          id: "herald-fight",
          title: "전령 앞 한타",
          description: "정면으로 지역을 장악한다",
          stats: ["teamfight", "physical", "calling"],
          risk: "HIGH",
        },
        {
          id: "herald-steal",
          title: "스틸 각을 만든다",
          description: "시야 밖에서 마지막 타이밍을 노린다",
          stats: ["objective", "reaction", "focus"],
          risk: "HIGH",
        },
        {
          id: "herald-cross",
          title: "바텀 이득과 교환",
          description: "전령을 주고 반대편에서 골드를 번다",
          stats: ["macro", "decision", "cs"],
          risk: "LOW",
        },
      ],
    },
  ],
  DRAGON: [
    {
      kind: "DRAGON",
      title: "드래곤",
      situation:
        "드래곤이 등장했습니다. 양 팀 모두 오브젝트 주변 시야를 두고 움직이기 시작합니다.",
      choices: [
        {
          id: "dragon-start",
          title: "먼저 드래곤을 친다",
          description: "상대를 끌어내며 오브젝트를 압박한다",
          stats: ["objective", "calling", "focus"],
          risk: "MEDIUM",
        },
        {
          id: "dragon-turn",
          title: "상대 진입을 받아친다",
          description: "드래곤보다 교전을 먼저 본다",
          stats: ["teamfight", "decision", "synergy"],
          risk: "MEDIUM",
        },
        {
          id: "dragon-steal",
          title: "스틸 각을 노린다",
          description: "불리한 구도에서 한 번에 뒤집는다",
          stats: ["objective", "reaction", "mental"],
          risk: "HIGH",
        },
      ],
    },
  ],
  BARON: [
    {
      kind: "BARON",
      title: "바론 교전",
      situation:
        "바론 시야가 완전히 어두워졌습니다. 상대가 바론을 치는지, 매복 중인지 확인되지 않습니다.",
      choices: [
        {
          id: "baron-check",
          title: "시야를 뚫고 진입",
          description: "위험을 감수하고 바론을 확인한다",
          stats: ["vision", "mental", "reaction"],
          risk: "HIGH",
        },
        {
          id: "baron-flank",
          title: "측면으로 크게 돈다",
          description: "정면 대신 후방 진입각을 만든다",
          stats: ["movement", "vision", "teamfight"],
          risk: "MEDIUM",
        },
        {
          id: "baron-wave",
          title: "사이드 웨이브를 민다",
          description: "상대에게 바론과 수비 중 선택을 강요한다",
          stats: ["macro", "decision", "calling"],
          risk: "LOW",
        },
      ],
    },
  ],
  PICK: [
    {
      kind: "PICK",
      title: "시야 없는 적 포착",
      situation:
        "상대 한 명이 본대와 떨어져 시야 밖 경계선에 들어왔습니다. 짧은 시간 동안만 잡을 수 있습니다.",
      choices: [
        {
          id: "pick-burst",
          title: "즉시 끊는다",
          description: "순간 화력으로 숫자 우위를 만든다",
          stats: ["killSense", "reaction", "focus"],
          risk: "MEDIUM",
        },
        {
          id: "pick-bait",
          title: "더 깊게 유인한다",
          description: "후속 인원까지 노린다",
          stats: ["vision", "decision", "mental"],
          risk: "HIGH",
        },
        {
          id: "pick-ignore",
          title: "위치만 확인하고 운영",
          description: "무리하지 않고 반대편 이득을 챙긴다",
          stats: ["macro", "calling", "decision"],
          risk: "LOW",
        },
      ],
    },
  ],
  DIVE: [
    {
      kind: "DIVE",
      title: "포탑 다이브",
      situation:
        "상대가 낮은 체력으로 포탑 아래에서 웨이브를 받고 있습니다. 우리 팀 인원이 먼저 모였습니다.",
      choices: [
        {
          id: "dive-go",
          title: "바로 다이브",
          description: "빠르게 킬과 포탑을 노린다",
          stats: ["physical", "teamfight", "reaction"],
          risk: "HIGH",
        },
        {
          id: "dive-zone",
          title: "퇴로만 막는다",
          description: "상대를 쫓아내고 포탑 골드를 챙긴다",
          stats: ["decision", "laning", "synergy"],
          risk: "LOW",
        },
        {
          id: "dive-wait",
          title: "다음 웨이브까지 기다린다",
          description: "확실한 타이밍을 만든다",
          stats: ["macro", "focus", "calling"],
          risk: "MEDIUM",
        },
      ],
    },
  ],
  INVADE: [
    {
      kind: "INVADE",
      title: "상대 정글 침투",
      situation:
        "상대 정글의 위치가 반대편에서 확인됐습니다. 가까운 캠프와 시야가 비어 있습니다.",
      choices: [
        {
          id: "invade-deep",
          title: "깊게 들어간다",
          description: "캠프와 킬까지 노린다",
          stats: ["vision", "movement", "killSense"],
          risk: "HIGH",
        },
        {
          id: "invade-ward",
          title: "시야만 남기고 나온다",
          description: "안전하게 다음 동선을 읽는다",
          stats: ["vision", "macro", "decision"],
          risk: "LOW",
        },
        {
          id: "invade-trap",
          title: "귀환 동선에 매복",
          description: "상대 정글 복귀를 노린다",
          stats: ["vision", "focus", "synergy"],
          risk: "MEDIUM",
        },
      ],
    },
  ],
  TEAMFIGHT: [
    {
      kind: "TEAMFIGHT",
      title: "미드 대치",
      situation:
        "양 팀 다섯 명이 미드에서 마주쳤습니다. 주요 궁극기가 대부분 살아 있습니다.",
      choices: [
        {
          id: "fight-engage",
          title: "먼저 이니시",
          description: "상대 핵심을 빠르게 노린다",
          stats: ["teamfight", "calling", "physical"],
          risk: "HIGH",
        },
        {
          id: "fight-peel",
          title: "상대 진입을 받아친다",
          description: "우리 딜러를 지키며 역공한다",
          stats: ["decision", "synergy", "mental"],
          risk: "LOW",
        },
        {
          id: "fight-side",
          title: "측면 각을 잡는다",
          description: "시야 밖에서 진형을 흔든다",
          stats: ["movement", "vision", "killSense"],
          risk: "MEDIUM",
        },
      ],
    },
  ],
};

function rng(seed: number) {
  let t = seed >>> 0;
  t += 0x6d2b79f5;
  let r = Math.imul(t ^ (t >>> 15), 1 | t);
  r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
  return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
}

function cloneMoment(
  template: Omit<ScrimMoment, "id" | "minute">,
  minute: number,
  serial: number,
): ScrimMoment {
  return {
    ...template,
    id: `${template.kind.toLowerCase()}-${minute}-${serial}`,
    minute,
    choices: template.choices.map((choice) => ({ ...choice })),
  };
}

function momentCountForGame(seed: number) {
  const r = rng(seed + 4401);
  if (r < 0.12) return 0;
  if (r < 0.3) return 1;
  if (r < 0.55) return 2;
  if (r < 0.77) return 3;
  if (r < 0.91) return 4;
  if (r < 0.98) return 5;
  return 6;
}

function allowedKinds(minute: number): ScrimMomentKind[] {
  if (minute <= 9) return ["LANE", "CRAB", "INVADE", "ROAM_TOP", "ROAM_BOT"];
  if (minute <= 16)
    return ["ROAM_TOP", "ROAM_BOT", "HERALD", "DRAGON", "DIVE", "INVADE"];
  if (minute <= 23)
    return [
      "DRAGON",
      "HERALD",
      "ROAM_TOP",
      "ROAM_BOT",
      "PICK",
      "DIVE",
      "TEAMFIGHT",
    ];
  return [
    "DRAGON",
    "BARON",
    "PICK",
    "TEAMFIGHT",
    "ROAM_TOP",
    "ROAM_BOT",
    "DIVE",
  ];
}

function buildMoments(game: GameState, endMinute: number): ScrimMoment[] {
  const count = momentCountForGame(game.actionSeed);
  if (count === 0) return [];

  // 경기마다 후보 타이밍 자체가 달라진다. 같은 9/19/29분 고정 구조를 없앤다.
  const candidates = [
    4, 6, 8, 10, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39,
  ].filter((minute) => minute < endMinute - 2);

  // 클러치 이벤트끼리는 최소 4분 간격을 둔다.
  // 점수가 높은 후보부터 뽑되, 이미 선택된 이벤트와 너무 가까운 시간은 제외한다.
  const MIN_MOMENT_GAP = 4;

  const rankedCandidates = candidates
    .map((minute, index) => ({
      minute,
      score: rng(game.actionSeed + 5100 + index * 97),
    }))
    .sort((a, b) => b.score - a.score);

  const selected: { minute: number; score: number }[] = [];

  for (const candidate of rankedCandidates) {
    const hasEnoughGap = selected.every(
      (picked) => Math.abs(picked.minute - candidate.minute) >= MIN_MOMENT_GAP,
    );

    if (!hasEnoughGap) continue;

    selected.push(candidate);
    if (selected.length >= Math.min(count, candidates.length)) break;
  }

  const scored = selected.sort((a, b) => a.minute - b.minute);

  let previousKind: ScrimMomentKind | null = null;
  return scored.map(({ minute }, index) => {
    let kinds = allowedKinds(minute);

    // 드래곤은 여러 번 등장할 수 있어 영혼/장로 흐름이 생기지만,
    // 다른 상황도 충분히 섞이도록 연속 동일 이벤트는 피한다.
    if (previousKind) {
      const withoutRepeat = kinds.filter((kind) => kind !== previousKind);
      if (withoutRepeat.length) kinds = withoutRepeat;
    }

    // 6분 이후에는 드래곤 이벤트의 비중을 높인다.
    const dragonWeight =
      minute >= 6 &&
      minute <= 36 &&
      rng(game.actionSeed + 6200 + index * 131) < 0.34;
    const kind =
      dragonWeight && kinds.includes("DRAGON")
        ? "DRAGON"
        : kinds[
            Math.floor(rng(game.actionSeed + 6300 + index * 149) * kinds.length)
          ];

    previousKind = kind;
    const templates = MOMENT_TEMPLATES[kind];
    const template =
      templates[
        Math.floor(rng(game.actionSeed + 6400 + index * 163) * templates.length)
      ];
    return cloneMoment(template, minute, index);
  });
}

function dynamicMoment(state: ScrimState, base: ScrimMoment): ScrimMoment {
  if (base.kind !== "DRAGON") return base;

  if (state.dragonSoulOwner) {
    return {
      ...base,
      title:
        state.teamElders + state.enemyElders === 0
          ? "장로 드래곤"
          : `장로 드래곤 ${state.teamElders + state.enemyElders + 1}차`,
      situation:
        "드래곤 영혼은 이미 결정됐습니다. 장로 드래곤을 두고 양 팀이 모든 시야와 인원을 집중합니다.",
    };
  }

  const total = state.teamDragons + state.enemyDragons;
  const soulPoint =
    state.teamDragons === 3
      ? " 우리 팀이 먹으면 4용과 드래곤 영혼을 완성합니다."
      : state.enemyDragons === 3
        ? " 상대가 먹으면 4용과 드래곤 영혼을 완성합니다."
        : "";

  return {
    ...base,
    title: total === 0 ? "첫 드래곤" : `${total + 1}번째 드래곤`,
    situation: `현재 드래곤 스택은 우리 ${state.teamDragons} : ${state.enemyDragons} 상대입니다.${soulPoint}`,
  };
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
  const playerName = game.player.name;
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
      pick([
        `${playerName} 선수가 라인을 밀어 넣고 먼저 움직일 준비를 합니다.`,
        `${playerName} 선수가 상대의 움직임을 확인하며 다음 플레이를 준비합니다.`,
        `${playerName} 선수 쪽 라인에서도 주도권 싸움이 치열해집니다.`,
      ]),
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
        ? `${playerName} 선수가 라인을 정리하고 강가 쪽으로 먼저 움직입니다. 우리 팀이 합류 우위를 만들고 있습니다.`
        : context === "BEHIND"
          ? `${playerName} 선수가 시야 밖에서 조심스럽게 합류 각을 찾습니다. 한 번의 반격이 필요한 상황입니다.`
          : `${playerName} 선수도 라인을 벗어나 강가 쪽으로 움직입니다. 양 팀의 합류 속도가 빨라집니다.`,
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
  const endMinute = 27 + Math.floor(rng(game.actionSeed + 4301) * 15); // 27~41분
  const moments = buildMoments(game, endMinute);
  const firstTarget = moments[0]?.minute ?? endMinute;

  return {
    minute: 0,
    teamKills: 0,
    enemyKills: 0,
    goldDiff: 0,
    playerKills: 0,
    playerDeaths: 0,
    playerAssists: 0,
    momentIndex: 0,
    moments,
    endMinute,
    teamDragons: 0,
    enemyDragons: 0,
    dragonSoulOwner: null,
    teamElders: 0,
    enemyElders: 0,
    teamBarons: 0,
    enemyBarons: 0,
    teamTowers: 0,
    enemyTowers: 0,
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
        text:
          moments.length === 0
            ? "경기가 시작됩니다. 오늘 경기는 큰 변수 없이 기본기 싸움으로 흘러갈 가능성이 있습니다."
            : "경기가 시작됩니다. 양 팀 모두 조심스럽게 라인전을 준비합니다.",
      },
    ],
  };
}

export function currentMoment(state: ScrimState) {
  const base = state.moments[state.momentIndex];
  if (!base || state.finished) return null;
  return state.minute >= base.minute ? dynamicMoment(state, base) : null;
}

export function hasRemainingMoments(state: ScrimState) {
  return state.momentIndex < state.moments.length;
}

export function advanceScrim(game: GameState, state: ScrimState): ScrimState {
  if (state.finished || currentMoment(state)) return state;

  const nextMoment = state.moments[state.momentIndex];
  const targetMinute = nextMoment?.minute ?? state.endMinute;

  // 중계 한 줄씩 진행한다. 클러치가 없는 경기라도 종료 시점까지 자연스럽게 흘러간다.
  if (state.commentaryIndex < state.commentary.length - 1) {
    const nextIndex = state.commentaryIndex + 1;
    const progress = (nextIndex + 1) / state.commentary.length;
    const nextMinute = Math.min(
      Math.max(state.minute + 1, targetMinute - 1),
      Math.max(state.minute + 1, Math.round(targetMinute * progress)),
    );

    const seed =
      game.actionSeed +
      state.momentIndex * 311 +
      nextIndex * 47 +
      state.minute * 13;
    const r = rng(seed);
    const scoreEvent = nextIndex === 3 || (nextIndex > 1 && r > 0.78);
    const scoreDiff = state.teamKills - state.enemyKills;
    const ourKillChance = scoreDiff <= -3 ? 0.42 : scoreDiff >= 3 ? 0.58 : 0.5;
    const ourKill = scoreEvent && r >= 1 - ourKillChance;
    const enemyKill = scoreEvent && !ourKill;

    return {
      ...state,
      minute: Math.min(targetMinute - 1, nextMinute),
      commentaryIndex: nextIndex,
      commentaryLog: [
        ...(state.commentaryLog ?? []),
        {
          minute: Math.min(targetMinute - 1, nextMinute),
          second: randomSecond(),
          text: state.commentary[nextIndex],
        },
      ],
      teamKills: state.teamKills + (ourKill ? 1 : 0),
      enemyKills: state.enemyKills + (enemyKill ? 1 : 0),
      teamTowers:
        state.teamTowers +
        (nextMinute >= 10 && r > 0.7 && state.teamTowers < 11 && !enemyKill
          ? 1
          : 0),
      enemyTowers:
        state.enemyTowers +
        (nextMinute >= 10 && r < 0.18 && state.enemyTowers < 11 && !ourKill
          ? 1
          : 0),
      goldDiff:
        state.goldDiff +
        (ourKill ? 320 : enemyKill ? -320 : 0) +
        (nextMinute >= 10 && r > 0.7 && state.teamTowers < 11 && !enemyKill
          ? 450
          : 0) -
        (nextMinute >= 10 && r < 0.18 && state.enemyTowers < 11 && !ourKill
          ? 450
          : 0),
    };
  }

  if (nextMoment) {
    return {
      ...state,
      minute: nextMoment.minute,
      commentaryLog: state.commentaryLog ?? [],
    };
  }

  return finishScrim(game, { ...state, minute: state.endMinute });
}

function choiceReaction(
  moment: ScrimMoment,
  choice: ScrimChoice,
  success: boolean,
): string[] {
  const reactions: Record<string, { success: string[]; fail: string[] }> = {
    punish: {
      success: [
        "상대가 한 발 더 들어온 순간 바로 받아칩니다! 정확한 킬각 판단입니다.",
        "과감하게 전진합니다! 상대의 퇴로를 막고 직접 킬을 만들어냅니다.",
        "빈틈을 놓치지 않았습니다. 솔로 킬로 라인 주도권을 완전히 가져옵니다!",
      ],
      fail: [
        "킬각을 노리고 깊게 들어갔지만 상대 정글이 기다리고 있었습니다!",
        "조금 과했습니다. 상대가 침착하게 받아치며 오히려 역으로 쓰러집니다.",
        "마무리를 노렸지만 계산이 어긋났습니다. 퇴로가 막히며 데스를 허용합니다.",
      ],
    },
    freeze: {
      success: [
        "싸움을 열지 않습니다. 라인을 완벽하게 묶으며 상대의 CS 손실을 만들어냅니다.",
        "침착하게 웨이브를 고정합니다. 상대는 앞으로 나올 수밖에 없는 상황입니다.",
        "킬 대신 라인 이득을 선택합니다. 안정적으로 격차를 벌려갑니다.",
      ],
      fail: [
        "라인을 묶으려 했지만 상대가 빠르게 밀고 먼저 움직입니다.",
        "안정적인 선택이었지만 상대가 로밍 타이밍을 얻었습니다.",
        "웨이브 관리가 조금 어긋납니다. 기대했던 만큼 상대를 묶어두지 못합니다.",
      ],
    },
    pressure: {
      success: [
        "라인을 밀어 넣고 곧바로 강가 시야를 장악합니다. 팀이 편하게 움직일 공간이 생깁니다.",
        "압박 후 먼저 사라집니다. 상대는 위치를 확인하지 못한 채 뒤로 물러섭니다.",
        "주도권을 시야로 연결했습니다. 우리 정글의 동선까지 훨씬 편해집니다.",
      ],
      fail: [
        "시야를 잡으러 이동하는 순간 상대가 먼저 숨어 있었습니다. 체력을 크게 잃습니다.",
        "라인 압박은 성공했지만 시야 장악 과정에서 동선이 읽혔습니다.",
        "강가로 먼저 움직였지만 팀의 합류가 늦습니다. 별다른 이득 없이 물러납니다.",
      ],
    },
    engage: {
      success: [
        "망설이지 않고 먼저 진입합니다! 완벽한 이니시에이팅으로 상대 진형이 무너집니다!",
        "교전을 직접 엽니다! 우리 팀이 즉시 호응하며 한타를 크게 이깁니다.",
        "상대 핵심 선수를 정확히 물었습니다! 드래곤 앞 전투를 지배합니다.",
      ],
      fail: [
        "먼저 들어갔지만 팀의 거리가 멉니다! 순식간에 포커싱을 당합니다.",
        "진입 타이밍이 너무 빨랐습니다. 상대가 역으로 받아치며 교전이 무너집니다.",
        "과감한 이니시는 좋았지만 상대가 예상하고 있었습니다. 먼저 쓰러집니다.",
      ],
    },
    wait: {
      success: [
        "끝까지 기다립니다. 상대가 먼저 무너진 순간 역으로 덮쳐 교전을 가져옵니다!",
        "상대의 성급한 진입을 흘려냅니다. 완벽한 역공 타이밍입니다.",
        "한 박자 참은 판단이 적중합니다. 상대 스킬이 빠진 뒤 안전하게 전투를 정리합니다.",
      ],
      fail: [
        "너무 오래 기다렸습니다. 상대가 먼저 드래곤을 정리하고 빠져나갑니다.",
        "역공을 노렸지만 상대가 빈틈을 주지 않습니다. 오브젝트를 그대로 내줍니다.",
        "교전을 열 타이밍을 놓쳤습니다. 팀이 서로 다른 판단을 하며 진형이 갈립니다.",
      ],
    },
    flank: {
      success: [
        "시야 밖으로 크게 돌아갑니다. 완벽한 측면 진입! 상대 딜러가 그대로 노출됩니다!",
        "상대가 정면만 보는 사이 뒤를 잡았습니다. 한타 구도가 완전히 무너집니다!",
        "측면 각이 제대로 열렸습니다. 상대 후방을 끊으며 대승을 만들어냅니다.",
      ],
      fail: [
        "측면으로 돌던 움직임이 와드에 포착됐습니다. 오히려 혼자 고립됩니다.",
        "플랭크를 노렸지만 상대가 먼저 눈치챕니다. 본대와 거리가 너무 멉니다.",
        "좋은 각을 찾으려다 합류가 늦었습니다. 우리 팀이 먼저 교전을 당합니다.",
      ],
    },
    carry: {
      success: [
        "직접 승부를 겁니다! 연속으로 상대를 정리하며 한타를 캐리합니다!",
        "가장 위험한 위치까지 파고듭니다. 개인 기량으로 상대 핵심 딜러를 제거합니다!",
        "승부처에서 손이 풀렸습니다! 압도적인 교전으로 경기를 끝낼 기회를 만듭니다.",
      ],
      fail: [
        "캐리를 노리고 깊게 들어갔지만 집중 포화를 버티지 못합니다!",
        "개인 기량으로 해결하려 했지만 상대의 CC 연계에 막힙니다.",
        "너무 큰 플레이를 노렸습니다. 먼저 쓰러지며 팀이 수적 열세에 놓입니다.",
      ],
    },
    objective: {
      success: [
        "킬을 쫓지 않고 오브젝트로 방향을 틉니다. 침착하게 큰 이득을 확보합니다.",
        "교전보다 오브젝트를 선택합니다. 상대가 따라오지 못하며 운영 격차가 벌어집니다.",
        "정확한 콜입니다. 팀이 빠르게 오브젝트를 녹이며 승기를 잡습니다.",
      ],
      fail: [
        "오브젝트를 먼저 치지만 상대의 진입을 막지 못합니다. 위험한 구도가 됩니다.",
        "운영을 선택했지만 상대가 더 빠르게 합류합니다. 오브젝트를 포기하고 물러납니다.",
        "목표물에 집중한 사이 상대가 측면을 파고듭니다. 판단이 꼬였습니다.",
      ],
    },
    team: {
      success: [
        "팀 콜에 정확히 맞춰 움직입니다. 다섯 명의 호흡이 맞으며 교전을 깔끔하게 정리합니다.",
        "개인 플레이를 줄이고 본대와 함께 갑니다. 빈틈 없는 연계가 나옵니다.",
        "팀의 진입 타이밍에 맞춰 스킬을 쏟아붓습니다. 안정적인 한타 승리입니다.",
      ],
      fail: [
        "팀 콜에 맞추려 했지만 순간적으로 판단이 엇갈립니다. 진형이 갈립니다.",
        "본대와 함께 움직였지만 상대의 변칙적인 진입에 대응이 늦었습니다.",
        "안정적인 선택이었지만 상대가 더 좋은 각을 만들었습니다. 교전에서 밀립니다.",
      ],
    },
  };

  const pool = reactions[choice.id];
  const resultText = pool
    ? pick(success ? pool.success : pool.fail)
    : success
      ? `${choice.title} 선택이 적중합니다. ${moment.title}에서 우리 팀이 이득을 가져갑니다.`
      : `${choice.title} 선택이 어긋납니다. ${moment.title}에서 상대가 빈틈을 파고듭니다.`;

  const followUp = success
    ? pick([
        "우리 팀이 이 기세를 이용해 시야와 라인 주도권까지 가져갑니다.",
        "상대가 한발 물러섭니다. 우리 팀이 다음 움직임을 먼저 선택할 수 있습니다.",
        "교전 이득이 골드 차이로 이어집니다. 경기 흐름이 우리 쪽으로 기웁니다.",
      ])
    : pick([
        "상대가 얻은 이득을 바탕으로 시야를 앞으로 밀어냅니다.",
        "우리 팀은 추가 손실을 막기 위해 잠시 뒤로 물러섭니다.",
        "흐름을 다시 가져오려면 다음 교전에서 더 신중한 판단이 필요합니다.",
      ]);

  return [resultText, followUp];
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
  const resolvedMoment = dynamicMoment(state, state.moments[state.momentIndex]);
  const reactionLines = choiceReaction(resolvedMoment, choice, success);
  const reactionMinute = state.minute;
  const reactionSecond = randomSecond();

  let next: ScrimState = {
    ...state,
    clutchTotal: state.clutchTotal + 1,
    momentIndex: state.momentIndex + 1,
    minute: state.minute + 2,
    commentaryLog: [
      ...(state.commentaryLog ?? []),
      {
        minute: reactionMinute,
        second: reactionSecond,
        text: `__CHOICE__[${choice.title}] ${reactionLines[0]}`,
      },
      {
        minute: reactionMinute,
        second: Math.min(
          59,
          reactionSecond + Math.floor(Math.random() * 8) + 2,
        ),
        text: `__CHOICE__${reactionLines[1]}`,
      },
    ],
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

  // 오브젝트 결과도 경기 상태에 누적한다.
  if (resolvedMoment.kind === "DRAGON") {
    if (state.dragonSoulOwner) {
      if (success) next.teamElders = state.teamElders + 1;
      else next.enemyElders = state.enemyElders + 1;
      next.goldDiff += success ? 1800 : -1800;
    } else if (success) {
      next.teamDragons = state.teamDragons + 1;
      if (next.teamDragons >= 4) next.dragonSoulOwner = "TEAM";
    } else {
      next.enemyDragons = state.enemyDragons + 1;
      if (next.enemyDragons >= 4) next.dragonSoulOwner = "ENEMY";
    }
  } else if (resolvedMoment.kind === "BARON") {
    if (success) next.teamBarons = state.teamBarons + 1;
    else next.enemyBarons = state.enemyBarons + 1;
    next.goldDiff += success ? 1400 : -1400;
    if (success) next.teamTowers = Math.min(11, next.teamTowers + 1);
    else next.enemyTowers = Math.min(11, next.enemyTowers + 1);
  } else if (
    resolvedMoment.kind === "HERALD" ||
    resolvedMoment.kind === "DIVE" ||
    resolvedMoment.kind === "ROAM_TOP" ||
    resolvedMoment.kind === "ROAM_BOT"
  ) {
    if (success && next.teamTowers < 11) next.teamTowers += 1;
    if (!success && resolvedMoment.kind === "DIVE" && next.enemyTowers < 11) {
      next.enemyTowers += 1;
    }
  }

  if (next.momentIndex >= next.moments.length) {
    next.commentary = [
      "큰 교전이 정리됐습니다. 양 팀이 남은 웨이브와 시야를 정리합니다.",
      "경기가 막바지로 향합니다. 마지막 운영에서 승패가 굳어집니다.",
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

export function getLiveWinProbability(game: GameState, state: ScrimState) {
  const teamPower =
    averageStats(game, ["laning", "macro", "decision", "teamfight", "mental"]) -
    50;

  const killDiff = state.teamKills - state.enemyKills;
  const dragonDiff = state.teamDragons - state.enemyDragons;
  const baronDiff = state.teamBarons - state.enemyBarons;
  const elderDiff = state.teamElders - state.enemyElders;
  const towerDiff = state.teamTowers - state.enemyTowers;
  const soulSwing =
    state.dragonSoulOwner === "TEAM"
      ? 10
      : state.dragonSoulOwner === "ENEMY"
        ? -10
        : 0;

  const raw =
    50 +
    teamPower * 0.35 +
    killDiff * 1.7 +
    (state.goldDiff / 1000) * 2.4 +
    dragonDiff * 3.0 +
    baronDiff * 5.5 +
    elderDiff * 11 +
    towerDiff * 2.2 +
    soulSwing;

  return Math.max(5, Math.min(95, Math.round(raw)));
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
