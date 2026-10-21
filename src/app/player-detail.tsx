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
import { getSecondTeamLivingLeague } from "../game/engine";
import { loadGame } from "../storage/db";
import type { GameState, SecondTeamPlayerArchetype } from "../types/game";

const LIME = "#C8FF37";
const ARCHETYPE: Record<SecondTeamPlayerArchetype, string> = {
  CARRY: "캐리형",
  ROAMER: "로밍형",
  CONTROL: "운영형",
  AGGRESSIVE: "공격형",
  STABLE: "안정형",
  SHOTCALLER: "오더형",
  DEVELOPMENT: "성장형",
};

export default function PlayerDetailScreen() {
  const { playerId } = useLocalSearchParams<{ playerId?: string }>();
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
  const player = teams.flatMap((t) => t.roster).find((p) => p.id === playerId);
  const team = player ? teams.find((t) => t.id === player.team) : undefined;
  if (!game || !player || !team) return <SafeAreaView style={s.safe} />;

  const kda = (player.kills + player.assists) / Math.max(1, player.deaths);
  const avg = player.games
    ? player.performanceTotal / player.games
    : player.lastPerformance;
  const trend =
    player.hotStreak >= 2
      ? `HOT · ${player.hotStreak}경기 상승세`
      : player.coldStreak >= 2
        ? `COLD · ${player.coldStreak}경기 부진`
        : player.form >= 78
          ? "좋은 폼 유지"
          : player.form <= 55
            ? "폼 회복 필요"
            : "보통";
  const growthGap = Math.max(0, player.potential - player.ovr);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.back}>
          <Text style={s.backText}>‹</Text>
        </Pressable>
        <View style={s.headerMain}>
          <Text style={s.kicker}>
            {team.name} · {player.position}
          </Text>
          <Text style={s.title}>{player.name}</Text>
          <Text style={s.desc}>
            {player.age}세 · {ARCHETYPE[player.archetype]} ·{" "}
            {player.starter ? "주전" : "벤치"}
          </Text>
        </View>
        <View style={s.ovrBox}>
          <Text style={s.ovrLabel}>OVR</Text>
          <Text style={s.ovr}>{player.ovr}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.list}>
        <View style={s.hero}>
          <Metric label="잠재력" value={String(player.potential)} />
          <Metric label="FORM" value={String(player.form)} />
          <Metric label="사기" value={String(player.morale)} />
          <Metric label="체력" value={String(player.stamina)} />
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>SEASON RECORD</Text>
          <View style={s.statGrid}>
            <Stat label="경기" value={`${player.games}G`} />
            <Stat label="세트" value={`${player.sets}S`} />
            <Stat
              label="K / D / A"
              value={`${player.kills} / ${player.deaths} / ${player.assists}`}
            />
            <Stat label="KDA" value={kda.toFixed(2)} />
            <Stat label="평균 평점" value={avg.toFixed(1)} />
            <Stat label="최근 평점" value={String(player.lastPerformance)} />
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>CURRENT STATUS</Text>
          <Bar label="폼" value={player.form} />
          <Bar label="사기" value={player.morale} />
          <Bar label="체력" value={player.stamina} />
          <Bar label="팀 시너지" value={player.synergy} />
          <Bar label="감독 신뢰" value={player.coachTrust} />
          <View style={s.statusLine}>
            <Text style={s.statusLabel}>최근 흐름</Text>
            <Text
              style={[
                s.statusValue,
                player.hotStreak >= 2 && s.accent,
                player.coldStreak >= 2 && s.danger,
              ]}
            >
              {trend}
            </Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>DEVELOPMENT</Text>
          <View style={s.devLine}>
            <View>
              <Text style={s.devBig}>{player.ovr}</Text>
              <Text style={s.devSmall}>현재 OVR</Text>
            </View>
            <Text style={s.arrow}>→</Text>
            <View>
              <Text style={s.devBig}>{player.potential}</Text>
              <Text style={s.devSmall}>잠재력</Text>
            </View>
          </View>
          <Text style={s.note}>
            {growthGap === 0
              ? "현재 잠재력 수준까지 성장했습니다."
              : `성장 여지 +${growthGap} · 시즌 EXP ${player.seasonXp}`}
          </Text>
        </View>

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/team-detail",
              params: { teamId: team.id },
            })
          }
          style={s.teamButton}
        >
          <Text style={s.teamButtonText}>{team.name} 로스터 보기 ›</Text>
        </Pressable>
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
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
    </View>
  );
}
function Bar({ label, value }: { label: string; value: number }) {
  return (
    <View style={s.barRow}>
      <Text style={s.barLabel}>{label}</Text>
      <View style={s.track}>
        <View
          style={[s.fill, { width: `${Math.max(0, Math.min(100, value))}%` }]}
        />
      </View>
      <Text style={s.barValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0C1014" },
  header: {
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    alignItems: "center",
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
  headerMain: { flex: 1, minWidth: 0 },
  kicker: { color: LIME, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  title: { color: "#FFF", fontSize: 27, fontWeight: "900", marginTop: 3 },
  desc: { color: "#818C95", fontSize: 10, fontWeight: "800", marginTop: 4 },
  ovrBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#202A17",
    borderWidth: 1,
    borderColor: "#4D6721",
    alignItems: "center",
    justifyContent: "center",
  },
  ovrLabel: { color: "#809451", fontSize: 8, fontWeight: "900" },
  ovr: { color: LIME, fontSize: 22, fontWeight: "900" },
  list: { paddingHorizontal: 18, paddingBottom: 32, gap: 9 },
  hero: { flexDirection: "row", gap: 7 },
  metric: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    borderRadius: 13,
    backgroundColor: "#12171B",
    borderWidth: 1,
    borderColor: "#222A30",
    alignItems: "center",
  },
  metricLabel: { color: "#6F7A83", fontSize: 8, fontWeight: "900" },
  metricValue: { color: "#FFF", fontSize: 17, fontWeight: "900", marginTop: 4 },
  card: {
    padding: 14,
    borderRadius: 15,
    backgroundColor: "#12171B",
    borderWidth: 1,
    borderColor: "#222A30",
  },
  cardTitle: {
    color: "#AEB7BE",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 12,
  },
  statGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 14 },
  stat: { width: "50%" },
  statLabel: { color: "#69747D", fontSize: 9, fontWeight: "800" },
  statValue: {
    color: "#F5F7F8",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4,
  },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  barLabel: { width: 66, color: "#8A959D", fontSize: 10, fontWeight: "800" },
  track: {
    flex: 1,
    height: 7,
    borderRadius: 5,
    backgroundColor: "#252C31",
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 5, backgroundColor: LIME },
  barValue: {
    width: 32,
    textAlign: "right",
    color: "#FFF",
    fontSize: 10,
    fontWeight: "900",
  },
  statusLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#222A30",
    paddingTop: 11,
    marginTop: 2,
  },
  statusLabel: { color: "#77828B", fontSize: 10, fontWeight: "800" },
  statusValue: { color: "#DCE1E4", fontSize: 10, fontWeight: "900" },
  accent: { color: LIME },
  danger: { color: "#FF8D8D" },
  devLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    paddingVertical: 4,
  },
  devBig: {
    color: "#FFF",
    fontSize: 25,
    fontWeight: "900",
    textAlign: "center",
  },
  devSmall: { color: "#68737C", fontSize: 9, fontWeight: "800", marginTop: 3 },
  arrow: { color: "#58636C", fontSize: 22, fontWeight: "900" },
  note: {
    color: "#818C95",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 12,
  },
  teamButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: "#202A17",
    borderWidth: 1,
    borderColor: "#4D6721",
    alignItems: "center",
    justifyContent: "center",
  },
  teamButtonText: { color: LIME, fontSize: 12, fontWeight: "900" },
});
