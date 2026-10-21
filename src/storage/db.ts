import AsyncStorage from "@react-native-async-storage/async-storage";
import { migrateGame } from "../game/engine";
import { GameState } from "../types/game";

const LEGACY_GAME_KEY = "@esports-career/game-state-v4";
const CAREER_INDEX_KEY = "@esports-career/career-index-v1";
const ACTIVE_CAREER_KEY = "@esports-career/active-career-v1";
const careerKey = (id: string) => `@esports-career/career-v1/${id}`;

export interface CareerSummary {
  id: string;
  name: string;
  position: GameState["player"]["position"];
  careerStage: GameState["player"]["careerStage"];
  date: string;
  avatar: GameState["player"]["avatar"];
  updatedAt: number;
}

function makeId() {
  return `career-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function readIndex(): Promise<CareerSummary[]> {
  const raw = await AsyncStorage.getItem(CAREER_INDEX_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CareerSummary[];
  } catch {
    return [];
  }
}

async function writeIndex(items: CareerSummary[]) {
  await AsyncStorage.setItem(CAREER_INDEX_KEY, JSON.stringify(items));
}

function summary(id: string, state: GameState): CareerSummary {
  return {
    id,
    name: state.player.name,
    position: state.player.position,
    careerStage: state.player.careerStage,
    date: state.date,
    avatar: state.player.avatar,
    updatedAt: Date.now(),
  };
}

async function migrateLegacySave() {
  const existing = await readIndex();
  if (existing.length > 0) return;

  const legacyRaw = await AsyncStorage.getItem(LEGACY_GAME_KEY);
  if (!legacyRaw) return;

  try {
    const state = migrateGame(JSON.parse(legacyRaw));
    const id = makeId();
    await AsyncStorage.setItem(careerKey(id), JSON.stringify(state));
    await writeIndex([summary(id, state)]);
    await AsyncStorage.setItem(ACTIVE_CAREER_KEY, id);
    // 원본은 안전망으로 남겨 둔다. 새 구조에서 정상 저장된 뒤에도 덮어쓰지 않는다.
  } catch (error) {
    console.warn("legacy career migration failed", error);
  }
}

export async function initDb() {
  await migrateLegacySave();
  return true;
}

export async function listCareers(): Promise<CareerSummary[]> {
  await migrateLegacySave();
  return (await readIndex()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getActiveCareerId(): Promise<string | null> {
  await migrateLegacySave();
  return AsyncStorage.getItem(ACTIVE_CAREER_KEY);
}

export async function setActiveCareer(id: string) {
  await AsyncStorage.setItem(ACTIVE_CAREER_KEY, id);
}

export async function createCareer(state: GameState): Promise<string> {
  await migrateLegacySave();
  const id = makeId();
  await AsyncStorage.setItem(careerKey(id), JSON.stringify(state));
  const items = await readIndex();
  await writeIndex([summary(id, state), ...items]);
  await setActiveCareer(id);
  return id;
}

export async function saveGame(state: GameState) {
  let id = await getActiveCareerId();
  if (!id) {
    await createCareer(state);
    return;
  }

  await AsyncStorage.setItem(careerKey(id), JSON.stringify(state));
  const items = await readIndex();
  const next = items.filter((item) => item.id !== id);
  next.unshift(summary(id, state));
  await writeIndex(next);
}

export async function loadGame(): Promise<GameState | null> {
  try {
    const id = await getActiveCareerId();
    if (!id) return null;
    const raw = await AsyncStorage.getItem(careerKey(id));
    if (!raw) return null;
    return migrateGame(JSON.parse(raw));
  } catch (error) {
    console.warn("loadGame failed", error);
    return null;
  }
}

export async function deleteCareer(id: string) {
  await AsyncStorage.removeItem(careerKey(id));
  const items = (await readIndex()).filter((item) => item.id !== id);
  await writeIndex(items);

  const active = await AsyncStorage.getItem(ACTIVE_CAREER_KEY);
  if (active === id) {
    if (items[0]) await AsyncStorage.setItem(ACTIVE_CAREER_KEY, items[0].id);
    else await AsyncStorage.removeItem(ACTIVE_CAREER_KEY);
  }
}

// 기존 호출부 호환용: 현재 선택된 커리어만 삭제한다.
export async function deleteGame() {
  const id = await getActiveCareerId();
  if (id) await deleteCareer(id);
}
