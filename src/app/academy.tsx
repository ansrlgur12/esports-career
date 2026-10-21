import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { loadGame } from "../storage/db";
import { GameState } from "../types/game";

const LIME = "#C8FF37";

export default function AcademyScreen() {
  const [game, setGame] = useState<GameState | null>(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      loadGame().then((loaded) => {
        if (mounted && loaded) setGame(loaded);
      });
      return () => {
        mounted = false;
      };
    }, []),
  );

  if (!game) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.loading}>불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  if (game.player.careerStage !== "ACADEMY") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.title}>아카데미</Text>
          <Text style={styles.muted}>아카데미 승격 후 확인할 수 있습니다.</Text>
          <Pressable style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>돌아가기</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const s = game.player.academySeason;
  const k = game.player.seasonStats;
  const kda =
    k.deaths === 0 ? k.kills + k.assists : (k.kills + k.assists) / k.deaths;
  const winRate =
    s.wins + s.losses === 0 ? 0 : (s.wins / (s.wins + s.losses)) * 100;
  const avgPerformance = s.matchHistory.length
    ? s.matchHistory.reduce((sum, m) => sum + m.performanceScore, 0) /
      s.matchHistory.length
    : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <View>
            <Text style={styles.kicker}>ACADEMY LEAGUE</Text>
            <Text style={styles.title}>시즌 기록</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.rank}>{s.teamRank}위</Text>
          <Text style={styles.record}>
            {s.wins}승 {s.losses}패 · 승률 {winRate.toFixed(0)}%
          </Text>
          <Text style={styles.round}>다음 경기 {s.round}R</Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>KDA</Text>
            <Text style={styles.statValue}>{kda.toFixed(2)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>K / D / A</Text>
            <Text style={styles.statValue}>
              {k.kills}/{k.deaths}/{k.assists}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>평균 퍼포먼스</Text>
            <Text style={styles.statValue}>{avgPerformance.toFixed(1)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>1군 관심도</Text>
            <Text style={styles.statValue}>{s.firstTeamInterest}%</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>최근 경기</Text>
        {s.matchHistory.length === 0 ? (
          <View style={styles.historyCard}>
            <Text style={styles.muted}>아직 공식전 기록이 없습니다.</Text>
          </View>
        ) : (
          [...s.matchHistory].reverse().map((m) => (
            <View key={`${m.date}-${m.round}`} style={styles.historyCard}>
              <View style={styles.historyTop}>
                <Text style={styles.historyRound}>
                  {m.round}R · vs {m.opponentName}
                </Text>
                <Text style={[styles.result, m.win ? styles.win : styles.loss]}>
                  {m.win ? "승" : "패"}
                </Text>
              </View>
              <Text style={styles.historyKda}>
                {m.kills}/{m.deaths}/{m.assists} · 퍼포먼스 {m.performanceScore}
              </Text>
              <Text style={styles.historyMeta}>
                {m.date} · 상대 전력 {m.opponentPower}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0B0E10" },
  content: { padding: 20, paddingBottom: 40 },
  loading: { color: "#FFF", padding: 24 },
  empty: { flex: 1, padding: 24, justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 22,
  },
  back: { color: "#FFF", fontSize: 38, lineHeight: 40 },
  kicker: { color: LIME, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: "#FFF", fontSize: 26, fontWeight: "900" },
  muted: { color: "#8E979F", fontSize: 13 },
  hero: {
    backgroundColor: "#161B20",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#273039",
    marginBottom: 14,
  },
  rank: { color: LIME, fontSize: 36, fontWeight: "900" },
  record: { color: "#FFF", fontSize: 17, fontWeight: "800", marginTop: 4 },
  round: { color: "#8E979F", marginTop: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  stat: {
    width: "48%",
    backgroundColor: "#12161A",
    borderRadius: 14,
    padding: 14,
  },
  statLabel: { color: "#78828B", fontSize: 11, fontWeight: "800" },
  statValue: { color: "#FFF", fontSize: 19, fontWeight: "900", marginTop: 5 },
  sectionTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
  },
  historyCard: {
    backgroundColor: "#12161A",
    borderRadius: 14,
    padding: 14,
    marginBottom: 9,
  },
  historyTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyRound: { color: "#FFF", fontWeight: "900" },
  result: { fontWeight: "900", fontSize: 16 },
  win: { color: LIME },
  loss: { color: "#FF6B6B" },
  historyKda: { color: "#DDE3E8", fontWeight: "800", marginTop: 8 },
  historyMeta: { color: "#77818A", fontSize: 11, marginTop: 4 },
  button: {
    backgroundColor: LIME,
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
  },
  buttonText: { color: "#071000", fontWeight: "900" },
});
