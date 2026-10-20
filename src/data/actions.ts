import { ActionDef } from "../types/game";

export const ACTIONS: ActionDef[] = [
  // =========================================================
  // 기계적 능력
  // =========================================================

  {
    id: "reaction-training",
    name: "반응속도 훈련",
    xp: {
      reaction: 90,
      physical: 30,
      focus: 20,
    },
    stamina: -24,
    condition: -3,
    stress: 4,
    tags: ["ALL"],
    weight: 10,
  },

  {
    id: "mechanics-training",
    name: "피지컬 훈련",
    xp: {
      physical: 85,
      reaction: 25,
      movement: 25,
      accuracy: 15,
    },
    stamina: -24,
    condition: -3,
    stress: 3,
    tags: ["ALL"],
    weight: 10,
  },

  {
    id: "accuracy-training",
    name: "정확도 훈련",
    xp: {
      accuracy: 90,
      focus: 25,
      physical: 20,
    },
    stamina: -20,
    condition: -2,
    stress: 3,
    tags: ["ALL"],
    weight: 9,
  },

  {
    id: "movement-training",
    name: "무빙 훈련",
    xp: {
      movement: 85,
      physical: 25,
      survival: 25,
      reaction: 15,
    },
    stamina: -23,
    condition: -3,
    stress: 3,
    tags: ["ALL"],
    weight: 9,
  },

  {
    id: "focus-training",
    name: "집중력 훈련",
    xp: {
      focus: 85,
      accuracy: 25,
      cs: 20,
      mental: 15,
    },
    stamina: -18,
    condition: -2,
    stress: 4,
    tags: ["ALL"],
    weight: 9,
  },

  // =========================================================
  // 라인전
  // =========================================================

  {
    id: "laning-training",
    name: "라인전 훈련",
    xp: {
      laning: 85,
      cs: 25,
      killSense: 25,
      survival: 15,
    },
    stamina: -25,
    condition: -3,
    stress: 5,
    tags: ["TOP", "MID", "BOT"],
    weight: 10,
  },

  {
    id: "cs-training",
    name: "CS 집중훈련",
    xp: {
      cs: 90,
      focus: 30,
      laning: 25,
    },
    stamina: -14,
    condition: -1,
    stress: 2,
    tags: ["TOP", "MID", "BOT"],
    weight: 9,
  },

  {
    id: "kill-training",
    name: "킬각 훈련",
    xp: {
      killSense: 85,
      laning: 25,
      decision: 25,
      physical: 15,
    },
    stamina: -22,
    condition: -2,
    stress: 4,
    tags: ["TOP", "JUNGLE", "MID", "BOT"],
    weight: 9,
  },

  {
    id: "survival-training",
    name: "생존 훈련",
    xp: {
      survival: 85,
      movement: 25,
      decision: 20,
      vision: 15,
    },
    stamina: -20,
    condition: -2,
    stress: 3,
    tags: ["ALL"],
    weight: 8,
  },

  {
    id: "champion-pool-training",
    name: "챔피언 연구",
    xp: {
      champPool: 80,
      laning: 25,
      decision: 20,
      physical: 20,
    },
    stamina: -15,
    condition: -1,
    stress: 2,
    tags: ["ALL"],
    weight: 8,
  },

  // =========================================================
  // 게임 IQ
  // =========================================================

  {
    id: "macro-analysis",
    name: "운영 분석",
    xp: {
      macro: 85,
      decision: 30,
      objective: 20,
      vision: 15,
    },
    stamina: -10,
    condition: 0,
    stress: 3,
    tags: ["JUNGLE", "SUPPORT", "TEAM"],
    weight: 9,
  },

  {
    id: "vision-training",
    name: "시야 훈련",
    xp: {
      vision: 85,
      decision: 25,
      macro: 20,
      survival: 15,
    },
    stamina: -16,
    condition: -1,
    stress: 2,
    tags: ["JUNGLE", "SUPPORT", "TEAM"],
    weight: 9,
  },

  {
    id: "decision-training",
    name: "판단력 훈련",
    xp: {
      decision: 80,
      macro: 25,
      teamfight: 20,
      survival: 15,
    },
    stamina: -17,
    condition: -1,
    stress: 3,
    tags: ["ALL"],
    weight: 8,
  },

  {
    id: "objective-training",
    name: "오브젝트 훈련",
    xp: {
      objective: 85,
      macro: 30,
      decision: 20,
      vision: 15,
    },
    stamina: -18,
    condition: -2,
    stress: 3,
    tags: ["JUNGLE", "SUPPORT", "TEAM"],
    weight: 8,
  },

  {
    id: "teamfight-training",
    name: "한타 훈련",
    xp: {
      teamfight: 80,
      decision: 25,
      physical: 20,
      movement: 15,
      synergy: 15,
    },
    stamina: -26,
    condition: -4,
    stress: 5,
    tags: ["TEAM", "ALL"],
    weight: 8,
  },

  // =========================================================
  // 팀 능력
  // =========================================================

  {
    id: "calling-training",
    name: "콜 훈련",
    xp: {
      calling: 85,
      decision: 25,
      macro: 20,
      synergy: 15,
    },
    stamina: -15,
    condition: -1,
    stress: 3,
    tags: ["JUNGLE", "SUPPORT", "TEAM"],
    weight: 8,
  },

  {
    id: "teamwork-training",
    name: "팀워크 훈련",
    xp: {
      synergy: 85,
      calling: 25,
      teamfight: 20,
      decision: 15,
    },
    stamina: -17,
    condition: -1,
    stress: 2,
    tags: ["TEAM"],
    weight: 8,
  },

  // =========================================================
  // 실전
  // =========================================================

  {
    id: "solo-queue",
    name: "솔로랭크",
    xp: {
      physical: 25,
      reaction: 20,
      laning: 20,
      killSense: 20,
      decision: 20,
      teamfight: 20,
      mental: 15,
    },
    stamina: -18,
    condition: -2,
    stress: 4,
    tags: ["ALL"],
    weight: 11,
  },

  {
    id: "scrim",
    name: "팀 스크림",
    xp: {
      laning: 20,
      macro: 20,
      decision: 20,
      objective: 15,
      teamfight: 25,
      calling: 15,
      synergy: 25,
    },
    stamina: -27,
    condition: -4,
    stress: 5,
    tags: ["TEAM"],
    weight: 10,
  },

  {
    id: "replay-analysis",
    name: "리플레이 분석",
    xp: {
      macro: 30,
      decision: 30,
      objective: 20,
      teamfight: 20,
    },
    stamina: -7,
    condition: 0,
    stress: 2,
    tags: ["ALL"],
    weight: 8,
  },

  // =========================================================
  // 생활 / 부가 활동
  // =========================================================

  {
    id: "streaming",
    name: "개인 방송",
    xp: {
      mental: 15,
      calling: 10,
    },
    stamina: -12,
    condition: -1,
    stress: 3,
    tags: ["LIFE", "ALL"],
    weight: 6,
  },

  {
    id: "team-time",
    name: "팀원과 시간 보내기",
    xp: {
      synergy: 35,
      calling: 15,
      mental: 10,
    },
    stamina: -6,
    condition: 1,
    stress: -8,
    tags: ["LIFE", "TEAM"],
    weight: 6,
  },

  // =========================================================
  // 회복
  // =========================================================

  {
    id: "rest",
    name: "휴식",
    xp: {},
    stamina: 35,
    condition: 8,
    stress: -12,
    tags: ["RECOVERY", "ALL"],
    weight: 6,
  },

  {
    id: "self-care",
    name: "컨디션 관리",
    xp: {},
    stamina: 15,
    condition: 12,
    stress: -18,
    tags: ["RECOVERY", "ALL"],
    weight: 5,
  },

  {
    id: "sleep",
    name: "수면",
    xp: {},
    stamina: 55,
    condition: 15,
    stress: -12,
    tags: ["RECOVERY"],
    weight: 1,
  },

  {
    id: "meditation",
    name: "명상",
    xp: {
      mental: 20,
      focus: 15,
    },
    stamina: 8,
    condition: 4,
    stress: -20,
    tags: ["EVENING", "RECOVERY", "ALL"],
    weight: 6,
  },
];
