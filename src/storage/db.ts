import AsyncStorage from '@react-native-async-storage/async-storage';
import { migrateGame } from '../game/engine';
import { GameState } from '../types/game';

const GAME_KEY = '@esports-career/game-state-v4';

export async function initDb() {
  // AsyncStorage 기반이라 별도 DB 초기화가 필요하지 않음.
  return true;
}

export async function saveGame(state:GameState) {
  await AsyncStorage.setItem(GAME_KEY, JSON.stringify(state));
}

export async function loadGame(): Promise<GameState | null> {
  try {
    const raw = await AsyncStorage.getItem(GAME_KEY);

    if (!raw) return null;

    return migrateGame(JSON.parse(raw));
  } catch (error) {
    console.warn('loadGame failed', error);
    return null;
  }
}

export async function deleteGame() {
  await AsyncStorage.removeItem(GAME_KEY);
}
