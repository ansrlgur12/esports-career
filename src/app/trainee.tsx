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

import {
  getAcademyCallupCandidates,
  getPositionStandings,
  getPromotionChanceLabel,
  getTraineeRank,
  getTraineeStandings,
} from "../game/engine";
import { loadGame } from "../storage/db";
import { GameState } from "../types/game";

const LIME = "#C8FF37";

function nextFirstMonday(fromDate: string) {
  const [y, m, d] = fromDate.split("-").map(Number);
  const current = new Date(Date.UTC(y, m - 1, d));
  for (let i = 0; i <= 40; i++) {
    const test = new Date(current);
    test.setUTCDate(current.getUTCDate() + i);
    if (test.getUTCDay() === 1 && test.getUTCDate() <= 7) {
      return { date: test, daysAway: i };
    }
  }
  return { date: current, daysAway: 0 };
}

export default function TraineeScreen() {
  const [game, setGame] = useState<GameState | null>(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      loadGame().then((loaded) => {
        if (mounted && loaded) {
          setGame(loaded);
        }
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

  const rank = getTraineeRank(game);
  const promotion = getPromotionChanceLabel(game);
  const standings = getTraineeStandings(game);
  const positionStandings = getPositionStandings(game);
  const callupCandidates = getAcademyCallupCandidates(game);
  const scrims = game.player.traineeScrimHistory ?? [];
  const recentScrims = [...scrims].reverse().slice(0, 6);
  const wins = scrims.filter((x) => x.win).length;
  const losses = scrims.length - wins;
  const avgPerformance = scrims.length
    ? scrims.reduce((sum, x) => sum + x.performanceScore, 0) / scrims.length
    : 0;
  const totalDeaths = scrims.reduce((sum, x) => sum + x.deaths, 0);
  const scrimKda = scrims.length
    ? totalDeaths === 0
      ? scrims.reduce((sum, x) => sum + x.kills + x.assists, 0)
      : scrims.reduce((sum, x) => sum + x.kills + x.assists, 0) / totalDeaths
    : 0;

  const evaluations = [...(game.player.evaluationHistory ?? [])].reverse();
  const nextEvaluation = nextFirstMonday(game.date);
  const dateLabel = `${String(nextEvaluation.date.getUTCMonth() + 1).padStart(2, "0")}/${String(nextEvaluation.date.getUTCDate()).padStart(2, "0")}`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <View>
            <Text style={styles.kicker}>TRAINEE CENTER</Text>
            <Text style={styles.title}>
              {game.player.name} · {game.player.position}
            </Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View>
            <Text style={styles.heroLabel}>팀 내 경쟁</Text>
            <Text style={styles.rank}>
              {rank.rank} / {rank.total}위
            </Text>
          </View>
          <View style={styles.promotionBox}>
            <Text style={styles.heroLabel}>아카데미 승격</Text>
            <Text style={styles.promotion}>{promotion}</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>코치 신뢰</Text>
            <Text style={styles.metricValue}>{game.player.coachTrust}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>주전 경쟁</Text>
            <Text style={styles.metricValue}>
              {game.player.starterCompetition}
            </Text>
          </View>
        </View>

        <View style={styles.nextCard}>
          <Text style={styles.cardKicker}>NEXT MONTHLY EVALUATION</Text>
          <Text style={styles.nextTitle}>{dateLabel} · 첫째 주 월요일</Text>
          <Text style={styles.nextDday}>
            {nextEvaluation.daysAway === 0
              ? "TODAY"
              : `D-${nextEvaluation.daysAway}`}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>연습생 경쟁 순위</Text>
        <View style={styles.card}>
          {standings.map((row) => (
            <View
              key={row.id}
              style={[
                styles.standingRow,
                row.isPlayer && styles.playerStanding,
              ]}
            >
              <Text style={styles.standingRank}>{row.rank}</Text>
              <View style={styles.standingNameBox}>
                <Text
                  style={[
                    styles.standingName,
                    row.isPlayer && styles.playerName,
                  ]}
                >
                  {row.name}
                </Text>
                <Text style={styles.standingPosition}>{row.position}</Text>
              </View>
              <Text style={styles.standingOvr}>OVR {row.ovr}</Text>
              <Text
                style={
                  row.trend > 0
                    ? styles.up
                    : row.trend < 0
                      ? styles.down
                      : styles.flat
                }
              >
                {row.trend > 0 ? "▲" : row.trend < 0 ? "▼" : "—"}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>
          {game.player.position} 포지션 경쟁
        </Text>
        <View style={styles.card}>
          {positionStandings.map((row, index) => (
            <View
              key={row.id}
              style={[
                styles.standingRow,
                row.isPlayer && styles.playerStanding,
              ]}
            >
              <Text style={styles.standingRank}>{index + 1}</Text>
              <View style={styles.standingNameBox}>
                <Text
                  style={[
                    styles.standingName,
                    row.isPlayer && styles.playerName,
                  ]}
                >
                  {row.name}
                </Text>
                <Text style={styles.standingPosition}>
                  {row.isPlayer ? "YOU" : "RIVAL"}
                </Text>
              </View>
              <Text style={styles.standingOvr}>OVR {row.ovr}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>아카데미 콜업 후보</Text>
        <View style={styles.callupCard}>
          {callupCandidates.map((candidate, index) => (
            <View
              key={candidate.id}
              style={[
                styles.callupRow,
                candidate.isPlayer && styles.playerCallupRow,
              ]}
            >
              <Text style={styles.callupRank}>{index + 1}</Text>
              <View style={styles.callupInfo}>
                <Text
                  style={[
                    styles.callupName,
                    candidate.isPlayer && styles.playerName,
                  ]}
                >
                  {candidate.name}
                  {candidate.isPlayer ? " · YOU" : ""}
                </Text>
                <Text style={styles.callupReason}>{candidate.reason}</Text>
              </View>
              <Text style={styles.callupScore}>{candidate.score}</Text>
            </View>
          ))}
          <Text style={styles.callupHint}>
            포지션 순위와 최근 경쟁력을 바탕으로 한 현재 후보입니다. 1위가
            곧바로 승격을 의미하지는 않습니다.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>정기 스크림 기록</Text>
        <View style={styles.summary}>
          <Text style={styles.summaryMain}>
            {wins}승 {losses}패
          </Text>
          <Text style={styles.summaryText}>
            평균 퍼포먼스 {avgPerformance.toFixed(1)} · KDA{" "}
            {scrimKda.toFixed(2)}
          </Text>
        </View>

        {recentScrims.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.muted}>아직 정기 스크림 기록이 없습니다.</Text>
          </View>
        ) : (
          recentScrims.map((s) => (
            <View key={`${s.date}-${s.kills}-${s.deaths}`} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.cardTitle}>
                  {s.date.slice(5)} · {s.grade}
                </Text>
                <Text style={s.win ? styles.win : styles.loss}>
                  {s.win ? "승" : "패"}
                </Text>
              </View>
              <Text style={styles.cardText}>
                {s.kills}/{s.deaths}/{s.assists} · 퍼포먼스 {s.performanceScore}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>월간 평가 기록</Text>
        {evaluations.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.muted}>아직 월간 평가 기록이 없습니다.</Text>
          </View>
        ) : (
          evaluations.map((e, i) => (
            <View key={`${e.date}-${i}`} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.evalGrade}>{e.grade}</Text>
                <Text style={styles.cardTitle}>{e.date}</Text>
                <Text style={styles.score}>{e.performanceScore}점</Text>
              </View>
              {e.matchScore != null && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>평가전 50%</Text>
                    <Text style={styles.detailValue}>{e.matchScore}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>스크림 25%</Text>
                    <Text style={styles.detailValue}>{e.scrimScore}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>OVR 15%</Text>
                    <Text style={styles.detailValue}>{e.ovrScore}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>준비 상태 10%</Text>
                    <Text style={styles.detailValue}>{e.readinessScore}</Text>
                  </View>
                </>
              )}
              {e.rankBefore != null && e.rankAfter != null && (
                <Text style={styles.change}>
                  팀 내 순위 {e.rankBefore}위 → {e.rankAfter}위 · 코치 신뢰{" "}
                  {e.coachTrustBefore} → {e.coachTrustAfter}
                </Text>
              )}
              {e.promotionChanceAfter && (
                <Text style={styles.change}>
                  승격 가능성 {e.promotionChanceBefore} →{" "}
                  {e.promotionChanceAfter}
                </Text>
              )}
              {e.positionRankBefore != null && e.positionRankAfter != null && (
                <Text style={styles.rivalryChange}>
                  {game.player.position} 경쟁 {e.positionRankBefore}위 →{" "}
                  {e.positionRankAfter}위
                </Text>
              )}
              {e.rivalryMessage && (
                <Text style={styles.rivalryMessage}>{e.rivalryMessage}</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0B0E10" },
  content: { padding: 20, paddingBottom: 42 },
  loading: { color: "#FFF", padding: 24 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  back: { color: "#FFF", fontSize: 38, lineHeight: 40 },
  kicker: { color: LIME, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: "#FFF", fontSize: 24, fontWeight: "900" },
  hero: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#161B20",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#28313A",
  },
  heroLabel: { color: "#7F8993", fontSize: 10, fontWeight: "800" },
  rank: { color: "#FFF", fontSize: 30, fontWeight: "900", marginTop: 3 },
  promotionBox: { alignItems: "flex-end" },
  promotion: { color: LIME, fontSize: 22, fontWeight: "900", marginTop: 5 },
  metricRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  metric: {
    flex: 1,
    backgroundColor: "#12171B",
    padding: 14,
    borderRadius: 14,
  },
  metricLabel: { color: "#78828B", fontSize: 10, fontWeight: "800" },
  metricValue: { color: "#FFF", fontSize: 20, fontWeight: "900", marginTop: 4 },
  nextCard: {
    marginTop: 12,
    backgroundColor: "#11171A",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#263139",
  },
  cardKicker: { color: LIME, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  nextTitle: { color: "#FFF", fontSize: 16, fontWeight: "900", marginTop: 5 },
  nextDday: {
    color: LIME,
    fontSize: 24,
    fontWeight: "900",
    position: "absolute",
    right: 16,
    top: 18,
  },
  sectionTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 24,
    marginBottom: 10,
  },
  summary: {
    backgroundColor: "#151A1F",
    borderRadius: 14,
    padding: 14,
    marginBottom: 9,
  },
  summaryMain: { color: "#FFF", fontSize: 18, fontWeight: "900" },
  summaryText: {
    color: "#8E98A1",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#12171B",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: { color: "#FFF", fontWeight: "900" },
  cardText: { color: "#9AA3AB", fontSize: 11, fontWeight: "700", marginTop: 6 },
  win: { color: LIME, fontWeight: "900" },
  loss: { color: "#FF646D", fontWeight: "900" },
  muted: { color: "#77818A" },
  evalGrade: { color: LIME, fontSize: 22, fontWeight: "900" },
  score: { color: "#FFF", fontWeight: "900" },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 7,
  },
  detailLabel: { color: "#7F8993", fontSize: 10, fontWeight: "700" },
  detailValue: { color: "#DDE3E8", fontSize: 10, fontWeight: "900" },
  change: { color: "#AEB6BD", fontSize: 10, fontWeight: "700", marginTop: 9 },
  standingRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 46,
    borderBottomWidth: 1,
    borderBottomColor: "#20272D",
  },
  playerStanding: {
    backgroundColor: "#182015",
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  standingRank: { color: "#FFF", fontSize: 15, fontWeight: "900", width: 28 },
  standingNameBox: { flex: 1 },
  standingName: { color: "#DDE3E8", fontSize: 13, fontWeight: "900" },
  playerName: { color: LIME },
  standingPosition: {
    color: "#68737D",
    fontSize: 9,
    fontWeight: "800",
    marginTop: 2,
  },
  standingOvr: {
    color: "#AEB7BF",
    fontSize: 11,
    fontWeight: "900",
    marginRight: 12,
  },
  up: { color: LIME, fontWeight: "900" },
  down: { color: "#FF646D", fontWeight: "900" },
  flat: { color: "#65707A", fontWeight: "900" },
  callupCard: {
    backgroundColor: "#12171B",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2B343C",
  },
  callupRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 54,
    borderBottomWidth: 1,
    borderBottomColor: "#20272D",
  },
  playerCallupRow: {
    backgroundColor: "#182015",
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  callupRank: { color: LIME, width: 28, fontSize: 16, fontWeight: "900" },
  callupInfo: { flex: 1 },
  callupName: { color: "#FFF", fontSize: 13, fontWeight: "900" },
  callupReason: {
    color: "#77818A",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 3,
  },
  callupScore: { color: "#DDE3E8", fontSize: 13, fontWeight: "900" },
  callupHint: { color: "#66717A", fontSize: 9, lineHeight: 14, marginTop: 12 },
  rivalryChange: { color: LIME, fontSize: 10, fontWeight: "900", marginTop: 9 },
  rivalryMessage: {
    color: "#DDE3E8",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },
});
