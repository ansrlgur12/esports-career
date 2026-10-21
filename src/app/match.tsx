import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    completeAcademyMatch,
    completeTraineeEvaluation,
    completeTraineeScrim,
    getAcademyMatchInfo,
    getDayType,
} from "../game/engine";
import {
    advanceScrim,
    createScrim,
    currentMoment,
    finishScrim,
    resolveScrimChoice,
    ScrimChoice,
    ScrimState,
} from "../game/matchEngine";
import { loadGame, saveGame } from "../storage/db";
import { GameState } from "../types/game";

const LIME = "#C8FF37";

export default function MatchScreen() {
  const [game, setGame] = useState<GameState | null>(null);
  const [match, setMatch] = useState<ScrimState | null>(null);
  const [choiceMessage, setChoiceMessage] = useState<string | null>(null);
  const commentaryScrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      loadGame().then((loaded) => {
        if (!mounted || !loaded) return;

        const dayType = getDayType(loaded.date, loaded.player.careerStage);
        if (
          dayType !== "EVALUATION" &&
          dayType !== "SCRIM" &&
          dayType !== "ACADEMY_MATCH"
        ) {
          router.replace("/home");
          return;
        }

        setGame(loaded);
        setMatch(createScrim(loaded));
      });

      return () => {
        mounted = false;
      };
    }, []),
  );

  useEffect(() => {
    if (!game || !match || match.finished) return;

    const activeMoment = currentMoment(match);
    if (activeMoment) return;

    const timer = setTimeout(() => {
      const next =
        match.momentIndex >= 3 &&
        match.commentaryIndex >= match.commentary.length - 1
          ? finishScrim(game, match)
          : advanceScrim(game, match);

      setChoiceMessage(null);
      setMatch(next);
    }, 1400);

    return () => clearTimeout(timer);
  }, [game, match]);

  if (!game || !match) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>스크림 준비 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const moment = currentMoment(match);
  const matchDayType = getDayType(game.date, game.player.careerStage);
  const isAcademyOfficial = matchDayType === "ACADEMY_MATCH";
  const isTraineeEvaluation = matchDayType === "EVALUATION";
  const isRegularScrim = matchDayType === "SCRIM";
  const academyMatch = isAcademyOfficial ? getAcademyMatchInfo(game) : null;

  async function choose(choice: ScrimChoice) {
    if (!game || !match) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const resolved = resolveScrimChoice(game, match, choice);

    setChoiceMessage(
      resolved.success
        ? `성공 · 선택이 경기 흐름에 긍정적으로 작용했습니다.`
        : `실패 · 상대가 빈틈을 놓치지 않았습니다.`,
    );
    setMatch(resolved.state);
  }

  function signed(value: number) {
    return value > 0 ? `+${value}` : `${value}`;
  }

  async function finishEvaluation() {
    if (!game || !match?.result) return;
    const result = match.result;
    const next = isAcademyOfficial
      ? completeAcademyMatch(game, {
          win: result.win,
          playerKills: result.playerKills,
          playerDeaths: result.playerDeaths,
          playerAssists: result.playerAssists,
          performanceScore: result.performanceScore,
        })
      : isTraineeEvaluation
        ? completeTraineeEvaluation(game, {
            grade: result.grade,
            performanceScore: result.performanceScore,
            win: result.win,
            coachTrustDelta: result.coachTrustDelta,
            starterCompetitionDelta: result.starterCompetitionDelta,
          })
        : completeTraineeScrim(game, {
            grade: result.grade,
            performanceScore: result.performanceScore,
            win: result.win,
            playerKills: result.playerKills,
            playerDeaths: result.playerDeaths,
            playerAssists: result.playerAssists,
          });
    await saveGame(next);
    router.replace("/home");
  }

  if (match.finished && match.result) {
    const r = match.result;

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.resultScreen}>
          <Text style={styles.kicker}>
            {isAcademyOfficial ? "SECOND TEAM LEAGUE" : "SCRIM COMPLETE"}
          </Text>
          <Text style={styles.resultHeadline}>
            {r.win
              ? isAcademyOfficial
                ? "공식전 승리"
                : "스크림 승리"
              : isAcademyOfficial
                ? "공식전 패배"
                : "스크림 패배"}
          </Text>

          <View style={styles.scoreCard}>
            <Text style={styles.teamName}>
              {isAcademyOfficial ? "우리 2군" : "우리 ACADEMY"}
            </Text>
            <Text style={styles.finalScore}>
              {r.teamKills} : {r.enemyKills}
            </Text>
            <Text style={styles.teamName}>
              {academyMatch?.opponent.name ?? "NOVA ACADEMY"}
            </Text>
          </View>

          <View style={styles.kdaCard}>
            <Text style={styles.cardLabel}>개인 기록</Text>
            <Text style={styles.kda}>
              {r.playerKills} / {r.playerDeaths} / {r.playerAssists}
            </Text>
            <Text style={styles.smallText}>
              클러치 성공 {r.clutchSuccesses} / {r.clutchTotal}
            </Text>
          </View>

          {isTraineeEvaluation && (
            <View style={styles.evaluationBreakdown}>
              <Text style={styles.cardLabel}>MONTHLY EVALUATION</Text>
              <Text style={styles.breakdownTitle}>월간 종합 평가 산정</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>오늘 평가전</Text>
                <Text style={styles.breakdownValue}>
                  {r.performanceScore} × 50%
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>최근 정기 스크림</Text>
                <Text style={styles.breakdownValue}>최근 기록 × 25%</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>현재 기량</Text>
                <Text style={styles.breakdownValue}>OVR × 15%</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>준비 상태</Text>
                <Text style={styles.breakdownValue}>
                  컨디션 · 체력 · 멘탈 × 10%
                </Text>
              </View>
              <Text style={styles.breakdownHint}>
                최종 월간 점수와 등급은 경기 종료 후 커리어 기록에 저장됩니다.
              </Text>
            </View>
          )}

          <View style={styles.coachCard}>
            <View style={styles.gradeRow}>
              <View>
                <Text style={styles.cardLabel}>
                  {isAcademyOfficial
                    ? "공식전 평가"
                    : isRegularScrim
                      ? "스크림 피드백"
                      : "월간 코치 평가"}
                </Text>
                <Text style={styles.performance}>
                  퍼포먼스 {r.performanceScore}
                </Text>
              </View>
              <Text style={styles.grade}>{r.grade}</Text>
            </View>

            <Text style={styles.comment}>"{r.coachComment}"</Text>

            <View style={styles.feedbackRow}>
              <View style={styles.feedbackBox}>
                <Text style={styles.feedbackLabel}>강점</Text>
                <Text style={styles.feedbackText}>
                  {r.strengths.join(" · ")}
                </Text>
              </View>
              <View style={styles.feedbackBox}>
                <Text style={styles.feedbackLabel}>보완점</Text>
                <Text style={styles.feedbackText}>
                  {r.improvements.join(" · ")}
                </Text>
              </View>
            </View>

            {!isRegularScrim && (
              <View style={styles.deltaRow}>
                <Text style={styles.deltaText}>
                  코치 신뢰{" "}
                  <Text
                    style={[
                      styles.positive,
                      r.coachTrustDelta < 0 && styles.negative,
                    ]}
                  >
                    {signed(r.coachTrustDelta)}
                  </Text>
                </Text>
                <Text style={styles.deltaText}>
                  주전 경쟁{" "}
                  <Text
                    style={[
                      styles.positive,
                      r.starterCompetitionDelta < 0 && styles.negative,
                    ]}
                  >
                    {signed(r.starterCompetitionDelta)}
                  </Text>
                </Text>
              </View>
            )}
          </View>

          <Pressable style={styles.primaryButton} onPress={finishEvaluation}>
            <Text style={styles.primaryButtonText}>
              {isAcademyOfficial
                ? "경기 결과 확인"
                : isRegularScrim
                  ? "스크림 종료"
                  : "평가 확인"}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.kicker}>
            {isAcademyOfficial
              ? "ACADEMY LEAGUE · OFFICIAL"
              : isRegularScrim
                ? "TEAM SCRIM"
                : "ACADEMY EVALUATION · MONTHLY"}
          </Text>
          <Text style={styles.headerTitle}>
            {isAcademyOfficial
              ? "아카데미 리그"
              : isRegularScrim
                ? "정기 스크림"
                : "월간 연습생 평가전"}
          </Text>
          <Text style={styles.headerSub}>
            {isAcademyOfficial
              ? "공식전 · 경기 흐름은 자동 중계되며 중요한 순간에 직접 판단합니다."
              : "경기 상황은 자동으로 진행되고, 중요한 순간에만 직접 선택합니다."}
          </Text>
        </View>

        <View style={styles.scoreboard}>
          <View style={styles.team}>
            <Text style={styles.teamName}>
              {isAcademyOfficial ? "우리 2군" : "우리 ACADEMY"}
            </Text>
            <Text style={styles.teamScore}>{match.teamKills}</Text>
          </View>

          <View style={styles.clock}>
            <Text style={styles.minute}>{match.minute}:00</Text>
            <Text style={styles.gold}>
              골드 {match.goldDiff >= 0 ? "+" : ""}
              {(match.goldDiff / 1000).toFixed(1)}K
            </Text>
          </View>

          <View style={styles.team}>
            <Text style={styles.teamName}>
              {academyMatch?.opponent.name ?? "NOVA ACADEMY"}
            </Text>
            <Text style={styles.teamScore}>{match.enemyKills}</Text>
          </View>
        </View>

        <View style={styles.playerLine}>
          <Text style={styles.playerLineLabel}>{game.player.position}</Text>
          <Text style={styles.playerLineValue}>
            {match.playerKills} / {match.playerDeaths} / {match.playerAssists}
          </Text>
        </View>

        <View style={styles.gameArea}>
          {moment ? (
            <>
              <Text style={styles.clutchLabel}>CLUTCH SITUATION</Text>
              <Text style={styles.momentTitle}>{moment.title}</Text>
              <Text style={styles.situation}>{moment.situation}</Text>

              <View style={styles.choiceList}>
                {moment.choices.map((choice: ScrimChoice) => (
                  <Pressable
                    key={choice.id}
                    style={styles.choice}
                    onPress={() => choose(choice)}
                  >
                    <View style={styles.choiceTop}>
                      <Text style={styles.choiceTitle}>{choice.title}</Text>
                      <Text style={styles.risk}>{choice.risk}</Text>
                    </View>
                    <Text style={styles.choiceDesc}>{choice.description}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : (
            <>
              <View style={styles.liveHeader}>
                <Text style={styles.liveLabel}>LIVE MATCH FEED</Text>
                <Text style={styles.autoLabel}>1.4초 자동 진행</Text>
              </View>

              {choiceMessage && (
                <View style={styles.choiceResultCard}>
                  <Text style={styles.choiceResultLabel}>내 선택 결과</Text>
                  <Text style={styles.choiceResult}>{choiceMessage}</Text>
                </View>
              )}

              <ScrollView
                ref={commentaryScrollRef}
                style={styles.commentaryScroll}
                contentContainerStyle={styles.commentaryList}
                showsVerticalScrollIndicator
                nestedScrollEnabled
                onContentSizeChange={() =>
                  commentaryScrollRef.current?.scrollToEnd({ animated: true })
                }
              >
                {(match.commentaryLog ?? []).map((item, index) => (
                  <View
                    key={`${item.minute}-${item.second ?? 0}-${index}`}
                    style={styles.commentaryRow}
                  >
                    <Text style={styles.commentaryTime}>
                      {String(item.minute).padStart(2, "0")}:
                      {String(item.second ?? 0).padStart(2, "0")}
                    </Text>
                    <Text style={styles.commentaryLine}>{item.text}</Text>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.liveDots}>
                <View style={styles.liveDot} />
                <Text style={styles.progressDesc}>경기 자동 진행 중...</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0C1014" },
  screen: { flex: 1, padding: 18 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#FFF", fontWeight: "900" },

  header: { paddingTop: 10, paddingBottom: 20 },
  kicker: { color: LIME, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  headerTitle: { color: "#FFF", fontSize: 28, fontWeight: "900", marginTop: 4 },
  headerSub: {
    color: "#7E8994",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },

  scoreboard: {
    height: 118,
    borderRadius: 20,
    backgroundColor: "#161C22",
    borderWidth: 1,
    borderColor: "#29313A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 12,
  },
  team: { width: 100, alignItems: "center" },
  teamName: {
    color: "#AAB2BA",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },
  teamScore: { color: "#FFF", fontSize: 34, fontWeight: "900", marginTop: 4 },
  clock: { alignItems: "center" },
  minute: { color: LIME, fontSize: 18, fontWeight: "900" },
  gold: { color: "#89939D", fontSize: 9, fontWeight: "800", marginTop: 4 },

  playerLine: {
    marginTop: 10,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#13181D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  playerLineLabel: { color: LIME, fontSize: 11, fontWeight: "900" },
  playerLineValue: { color: "#FFF", fontSize: 17, fontWeight: "900" },

  gameArea: {
    flex: 1,
    marginTop: 14,
    borderRadius: 20,
    backgroundColor: "#151A20",
    borderWidth: 1,
    borderColor: "#252D35",
    padding: 18,
    justifyContent: "center",
  },
  clutchLabel: {
    color: "#FFB84D",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  momentTitle: { color: "#FFF", fontSize: 24, fontWeight: "900", marginTop: 5 },
  situation: {
    color: "#AAB2BA",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    marginTop: 8,
  },
  choiceList: { marginTop: 20, gap: 10 },
  choice: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#303943",
    backgroundColor: "#1B2229",
    padding: 14,
  },
  choiceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  choiceTitle: { color: "#FFF", fontSize: 14, fontWeight: "900" },
  risk: { color: "#8C97A2", fontSize: 8, fontWeight: "900" },
  choiceDesc: {
    color: "#7F8993",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3,
  },

  progressTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  progressDesc: {
    color: "#7F8993",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 7,
  },

  evaluationBreakdown: {
    borderRadius: 18,
    backgroundColor: "#12171C",
    borderWidth: 1,
    borderColor: "#29323A",
    padding: 16,
    marginBottom: 12,
  },
  breakdownTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  breakdownLabel: { color: "#8F99A3", fontSize: 11, fontWeight: "700" },
  breakdownValue: { color: "#FFF", fontSize: 11, fontWeight: "900" },
  breakdownHint: {
    color: "#69737D",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 9,
  },
  primaryButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: LIME,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  primaryButtonText: { color: "#071000", fontSize: 15, fontWeight: "900" },

  resultScreen: { padding: 20, paddingBottom: 40 },
  resultHeadline: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "900",
    marginTop: 5,
    marginBottom: 18,
  },
  scoreCard: {
    height: 90,
    borderRadius: 18,
    backgroundColor: "#161C22",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },
  finalScore: { color: LIME, fontSize: 28, fontWeight: "900" },
  kdaCard: {
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: "#151A20",
    padding: 16,
  },
  cardLabel: {
    color: "#88939D",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  kda: { color: "#FFF", fontSize: 26, fontWeight: "900", marginTop: 4 },
  smallText: {
    color: "#8C97A2",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3,
  },

  coachCard: {
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: "#151A20",
    borderWidth: 1,
    borderColor: "#2B343D",
    padding: 18,
  },
  gradeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  performance: { color: "#FFF", fontSize: 15, fontWeight: "900", marginTop: 3 },
  grade: { color: LIME, fontSize: 42, fontWeight: "900" },
  comment: {
    color: "#DCE2E7",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
    marginTop: 14,
  },
  feedbackRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  feedbackBox: {
    flex: 1,
    backgroundColor: "#1B2229",
    borderRadius: 12,
    padding: 11,
  },
  feedbackLabel: { color: "#7F8993", fontSize: 9, fontWeight: "900" },
  feedbackText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
  },
  deltaRow: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#2B343D",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  deltaText: { color: "#C5CDD4", fontSize: 11, fontWeight: "800" },
  positive: { color: LIME, fontWeight: "900" },
  negative: { color: "#FF6B6B" },
  liveHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  liveLabel: {
    color: LIME,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  autoLabel: {
    color: "#7F8993",
    fontSize: 10,
    fontWeight: "700",
  },
  choiceResultCard: {
    backgroundColor: "#242017",
    borderWidth: 1,
    borderColor: "#A97822",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  choiceResultLabel: {
    color: "#FFCF70",
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 5,
  },
  choiceResult: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "900",
  },
  commentaryScroll: {
    height: 210,
    borderRadius: 12,
    backgroundColor: "#10151A",
    borderWidth: 1,
    borderColor: "#2A333C",
  },
  commentaryList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1E252C",
  },
  commentaryTime: {
    width: 46,
    color: "#77818B",
    fontSize: 11,
    lineHeight: 18,
    fontWeight: "800",
  },
  commentaryLine: {
    flex: 1,
    color: "#E8EDF2",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  liveDots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    gap: 7,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: LIME,
  },
});
