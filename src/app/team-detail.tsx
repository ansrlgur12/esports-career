import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { getLeagueDashboard, getSecondTeamLivingLeague } from "../game/engine";
import { loadGame } from "../storage/db";
import type { GameState } from "../types/game";

const LIME = "#C8FF37";

export default function TeamDetailScreen() {
  const { teamId } = useLocalSearchParams<{ teamId?: string }>();
  const [game, setGame] = useState<GameState | null>(null);
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      loadGame().then((v) => mounted && setGame(v));
      return () => {
        mounted = false;
      };
    }, []),
  );
  const teams = useMemo(
    () => (game ? getSecondTeamLivingLeague(game) : []),
    [game],
  );
  const dashboard = useMemo(
    () => (game ? getLeagueDashboard(game) : null),
    [game],
  );
  const team = teams.find((t) => t.id === teamId);

  if (!game || !team || !dashboard) return <SafeAreaView style={s.safe} />;
  const standing = dashboard.standings.find((r) => r.team === team.name);
  const avgOvr = Math.round(
    team.roster.reduce((sum, p) => sum + p.ovr, 0) /
      Math.max(1, team.roster.length),
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.back}>
          <Text style={s.backText}>‹</Text>
        </Pressable>
        <View style={s.headerMain}>
          <Text style={s.kicker}>SECOND TEAM PROFILE</Text>
          <Text style={s.title}>{team.name}</Text>
          <Text style={s.desc}>
            {standing
              ? `${standing.rank}위 · ${standing.wins}승 ${standing.losses}패 · 세트 ${standing.setWins}-${standing.setLosses}`
              : "시즌 기록 없음"}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.list}>
        <View style={s.hero}>
          <Metric label="현재 전력" value={String(team.power)} />
          <Metric label="평균 OVR" value={String(avgOvr)} />
          <Metric label="팀 폼" value={String(team.form)} />
          <Metric label="시너지" value={String(team.synergy)} />
        </View>

        <View style={s.sectionHead}>
          <Text style={s.sectionTitle}>STARTING ROSTER</Text>
          <Text style={s.sectionSub}>선수를 눌러 상세 기록 확인</Text>
        </View>

        {team.roster.map((player) => (
          <Pressable
            key={player.id}
            onPress={() =>
              router.push({
                pathname: "/player-detail",
                params: { playerId: player.id },
              })
            }
            style={s.playerRow}
          >
            <View style={s.pos}>
              <Text style={s.posText}>{player.position}</Text>
            </View>
            <View style={s.main}>
              <View style={s.nameLine}>
                <Text style={s.name}>{player.name}</Text>
                {player.hotStreak >= 2 && (
                  <Text style={s.hot}>HOT {player.hotStreak}</Text>
                )}
                {player.coldStreak >= 2 && (
                  <Text style={s.cold}>COLD {player.coldStreak}</Text>
                )}
              </View>
              <Text style={s.sub}>
                {player.age}세 · {player.archetype} · {player.games}경기{" "}
                {player.sets}세트
              </Text>
            </View>
            <View style={s.right}>
              <Text style={s.ovr}>{player.ovr}</Text>
              <Text style={s.form}>FORM {player.form}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.metric}>
      <Text style={s.metricLabel}>{label}</Text>
      <Text style={s.metricValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0C1014" },
  header: {
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    alignItems: "flex-start",
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#171D22",
    borderWidth: 1,
    borderColor: "#293139",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  backText: { color: "#FFF", fontSize: 28, fontWeight: "700", lineHeight: 30 },
  headerMain: { flex: 1 },
  kicker: { color: LIME, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: "#FFF", fontSize: 27, fontWeight: "900", marginTop: 4 },
  desc: { color: "#87929B", fontSize: 11, fontWeight: "700", marginTop: 5 },
  list: { paddingHorizontal: 18, paddingBottom: 32, gap: 8 },
  hero: { flexDirection: "row", gap: 7, marginBottom: 10 },
  metric: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: "#12171B",
    borderWidth: 1,
    borderColor: "#222A30",
    alignItems: "center",
  },
  metricLabel: { color: "#6F7A83", fontSize: 8, fontWeight: "900" },
  metricValue: { color: "#FFF", fontSize: 18, fontWeight: "900", marginTop: 4 },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 5,
    marginBottom: 2,
  },
  sectionTitle: { color: "#FFF", fontSize: 14, fontWeight: "900" },
  sectionSub: { color: "#68737C", fontSize: 9, fontWeight: "800" },
  playerRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#12171B",
    borderWidth: 1,
    borderColor: "#222A30",
  },
  pos: {
    width: 48,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#202A17",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  posText: { color: LIME, fontSize: 9, fontWeight: "900" },
  main: { flex: 1, minWidth: 0 },
  nameLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { color: "#F5F7F8", fontSize: 15, fontWeight: "900" },
  hot: { color: LIME, fontSize: 8, fontWeight: "900" },
  cold: { color: "#FF8D8D", fontSize: 8, fontWeight: "900" },
  sub: { color: "#727D86", fontSize: 9, fontWeight: "700", marginTop: 4 },
  right: { alignItems: "flex-end" },
  ovr: { color: "#FFF", fontSize: 19, fontWeight: "900" },
  form: { color: "#77828B", fontSize: 8, fontWeight: "900", marginTop: 3 },
});
