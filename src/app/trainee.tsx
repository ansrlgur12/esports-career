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

import { getPromotionChanceLabel, getTraineeRank } from "../game/engine";
import { loadGame } from "../storage/db";
import { GameState } from "../types/game";

const LIME = "#C8FF37";

export default function TraineeScreen() {
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
        <View style={styles.center}>
          <Text style={styles.muted}>불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const rank = getTraineeRank(game);
  const promotion = getPromotionChanceLabel(game);
  const history = [...game.player.evaluationHistory].reverse();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ 홈</Text>
        </Pressable>

        <Text style={styles.kicker}>TRAINEE REPORT</Text>
        <Text style={styles.title}>연습생 현황</Text>

        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.label}>팀 내 평가</Text>
            <Text style={styles.value}>
              {rank.rank}위 <Text style={styles.sub}>/ {rank.total}명</Text>
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.label}>코치 신뢰</Text>
            <Text style={styles.value}>{game.player.coachTrust}</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.label}>주전 경쟁</Text>
            <Text style={styles.value}>{game.player.starterCompetition}</Text>
          </View>
        </View>

        <View style={styles.promotionCard}>
          <Text style={styles.label}>아카데미 승격 가능성</Text>
          <Text style={styles.promotion}>{promotion}</Text>

          {game.player.academyPromotionReady ? (
            <Text style={styles.ready}>
              승격 기준을 충족했습니다. 다음 승격 이벤트 대상입니다.
            </Text>
          ) : (
            <Text style={styles.muted}>
              최소 3회의 평가전과 꾸준한 코치 평가가 필요합니다.
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>최근 평가</Text>

        {history.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.muted}>아직 평가전 기록이 없습니다.</Text>
          </View>
        ) : (
          history.map((item, index) => (
            <View key={`${item.date}-${index}`} style={styles.historyRow}>
              <View>
                <Text style={styles.historyDate}>
                  {item.date.slice(5).replace("-", "/")}
                </Text>
                <Text style={styles.historyResult}>
                  {item.win ? "스크림 승리" : "스크림 패배"} · 퍼포먼스{" "}
                  {item.performanceScore}
                </Text>
              </View>
              <Text style={styles.grade}>{item.grade}</Text>
            </View>
          ))
        )}

        <View style={styles.coachBox}>
          <Text style={styles.label}>코치 의견</Text>
          <Text style={styles.coachText}>
            {game.player.academyPromotionReady
              ? '"최근 경기력이 충분히 올라왔다. 아카데미 합류를 검토하겠다."'
              : game.player.coachTrust >= 45
                ? '"가능성은 보인다. 다음 평가에서도 꾸준함을 보여줘라."'
                : '"아직은 더 증명해야 한다. 기본기와 팀 플레이에 집중해라."'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0C1014" },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  back: { color: "#9BA5AE", fontSize: 13, fontWeight: "800", marginBottom: 22 },
  kicker: { color: LIME, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: {
    color: "#FFF",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 4,
    marginBottom: 18,
  },

  summary: {
    flexDirection: "row",
    gap: 8,
  },
  summaryItem: {
    flex: 1,
    minHeight: 90,
    borderRadius: 16,
    backgroundColor: "#161C22",
    borderWidth: 1,
    borderColor: "#29313A",
    padding: 13,
    justifyContent: "space-between",
  },
  label: { color: "#818B95", fontSize: 9, fontWeight: "900" },
  value: { color: "#FFF", fontSize: 22, fontWeight: "900" },
  sub: { color: "#7F8993", fontSize: 10 },

  promotionCard: {
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: "#151A20",
    borderWidth: 1,
    borderColor: "#29313A",
    padding: 16,
  },
  promotion: { color: LIME, fontSize: 24, fontWeight: "900", marginTop: 4 },
  ready: { color: LIME, fontSize: 11, fontWeight: "800", marginTop: 7 },
  muted: { color: "#7F8993", fontSize: 11, fontWeight: "700", marginTop: 7 },

  sectionTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 24,
    marginBottom: 8,
  },
  empty: { borderRadius: 14, backgroundColor: "#151A20", padding: 16 },
  historyRow: {
    minHeight: 64,
    borderRadius: 14,
    backgroundColor: "#151A20",
    paddingHorizontal: 15,
    marginBottom: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyDate: { color: "#FFF", fontSize: 13, fontWeight: "900" },
  historyResult: {
    color: "#7F8993",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 3,
  },
  grade: { color: LIME, fontSize: 25, fontWeight: "900" },

  coachBox: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: "#1A2026",
    padding: 16,
  },
  coachText: {
    color: "#D8DEE4",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
    marginTop: 8,
  },
});
