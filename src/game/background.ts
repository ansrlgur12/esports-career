import { BACKGROUNDS } from "../data/backgrounds";
import type { GameState } from "../types/game";

export function getMainBackground(game: GameState, dayType: string) {
  const weekday = new Date(`${game.date}T00:00:00Z`).getUTCDay();
  const isWeekend = weekday === 0 || weekday === 6;
  const morningEventPending =
    game.slot === "MORNING" &&
    game.player.morningEventCompletedDate !== game.date;

  // 평가전 / 아카데미 공식전 → 경기장
  if (
    morningEventPending &&
    (dayType === "EVALUATION" || dayType === "ACADEMY_MATCH")
  ) {
    return BACKGROUNDS.STADIUM;
  }

  // 정기 스크림 → 현재 연습실 (토요일이어도 집보다 우선)
  if (morningEventPending && dayType === "SCRIM") {
    return game.player.careerStage === "ACADEMY"
      ? BACKGROUNDS.PRACTICE.ACADEMY
      : BACKGROUNDS.PRACTICE.TRAINEE;
  }

  // 나머지 주말 → 집
  if (isWeekend) {
    return BACKGROUNDS.HOME[game.slot];
  }

  // 평일 → 현재 단계 연습실
  if (game.player.careerStage === "ACADEMY") {
    return BACKGROUNDS.PRACTICE.ACADEMY;
  }

  return BACKGROUNDS.PRACTICE.TRAINEE;
}
