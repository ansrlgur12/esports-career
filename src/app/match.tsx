import * as Haptics from "expo-haptics";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    completeAcademyEvaluation,
    completeAcademyScrim,
    completeObservedSecondTeamMatch,
    completeSecondTeamMatch,
    decideSecondTeamNextSetRole,
    getDayType,
    getSecondTeamMatchInfo,
    getSecondTeamMatchRole,
} from "../game/engine";
import {
    advanceScrim,
    createScrim,
    currentMoment,
    finishScrim,
    getLiveWinProbability,
    resolveScrimChoice,
    ScrimChoice,
    ScrimState,
} from "../game/matchEngine";
import { loadGame, saveGame } from "../storage/db";
import { GameState } from "../types/game";

const LIME = "#C8FF37";

export default function MatchScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const startsOnBench = params.mode === "spectate";
  const [game, setGame] = useState<GameState | null>(null);
  const [playerInSet, setPlayerInSet] = useState(!startsOnBench);
  const [setNumber, setSetNumber] = useState(1);
  const [seriesTeamWins, setSeriesTeamWins] = useState(0);
  const [seriesEnemyWins, setSeriesEnemyWins] = useState(0);
  const [seriesPlayerKills, setSeriesPlayerKills] = useState(0);
  const [seriesPlayerDeaths, setSeriesPlayerDeaths] = useState(0);
  const [seriesPlayerAssists, setSeriesPlayerAssists] = useState(0);
  const [seriesPerformanceTotal, setSeriesPerformanceTotal] = useState(0);
  const [seriesPlayedSets, setSeriesPlayedSets] = useState(0);
  const [seriesStarterSets, setSeriesStarterSets] = useState(0);
  const [seriesStarterKills, setSeriesStarterKills] = useState(0);
  const [seriesStarterDeaths, setSeriesStarterDeaths] = useState(0);
  const [seriesStarterAssists, setSeriesStarterAssists] = useState(0);
  const [seriesStarterPerformanceTotal, setSeriesStarterPerformanceTotal] =
    useState(0);
  const [match, setMatch] = useState<ScrimState | null>(null);
  const [choiceMessage, setChoiceMessage] = useState<string | null>(null);
  const choiceResultOpacity = useRef(new Animated.Value(1)).current;
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
          dayType !== "SECOND_TEAM_MATCH"
        ) {
          router.replace("/home");
          return;
        }

        setGame(loaded);
        const officialRole =
          dayType === "SECOND_TEAM_MATCH"
            ? getSecondTeamMatchRole(loaded)
            : null;
        const initialPlayerInSet =
          officialRole != null ? officialRole.role === "PLAY" : !startsOnBench;
        const simulationGame = initialPlayerInSet
          ? { ...loaded, actionSeed: loaded.actionSeed + 101 }
          : {
              ...loaded,
              actionSeed: loaded.actionSeed + 101,
              player: {
                ...loaded.player,
                name: `VORTEX ${loaded.player.position}`,
              },
            };
        setPlayerInSet(initialPlayerInSet);
        setMatch(createScrim(simulationGame));
      });

      return () => {
        mounted = false;
      };
    }, []),
  );

  useEffect(() => {
    if (!game || !match || match.finished) return;

    const activeMoment = currentMoment(match);

    const timer = setTimeout(() => {
      if (activeMoment) {
        if (playerInSet) return;

        // 벤치 관전 중에는 사용자가 플레이 선택을 하지 않는다.
        // 경기장 안의 선수가 상황에 맞춰 자동으로 판단하고 경기는 같은 속도로 계속 진행된다.
        const autoChoice =
          activeMoment.choices[
            (game.actionSeed + match.momentIndex * 17 + match.minute) %
              activeMoment.choices.length
          ];
        const simulationGame = {
          ...game,
          actionSeed: game.actionSeed + setNumber * 101,
          player: { ...game.player, name: `VORTEX ${game.player.position}` },
        };
        const resolved = resolveScrimChoice(
          simulationGame,
          match,
          autoChoice,
        ).state;

        // 벤치 관전 중에는 클러치 선택 화면을 보여주지 않는다.
        // 자동 판단 후 바로 경기 흐름을 한 단계 더 진행한다.
        const continued =
          resolved.momentIndex >= resolved.moments.length &&
          resolved.commentaryIndex >= resolved.commentary.length - 1
            ? finishScrim(simulationGame, resolved)
            : advanceScrim(simulationGame, resolved);

        setMatch(continued);
        return;
      }

      const simulationGame = playerInSet
        ? { ...game, actionSeed: game.actionSeed + setNumber * 101 }
        : {
            ...game,
            actionSeed: game.actionSeed + setNumber * 101,
            player: { ...game.player, name: `VORTEX ${game.player.position}` },
          };
      const next =
        match.momentIndex >= match.moments.length &&
        match.commentaryIndex >= match.commentary.length - 1
          ? finishScrim(simulationGame, match)
          : advanceScrim(simulationGame, match);

      setMatch(next);
    }, 1200);

    return () => clearTimeout(timer);
  }, [game, match, playerInSet, setNumber]);

  // 내 선택 결과: 잠시 선명하게 보여준 뒤 부드럽게 fade out.
  // 전체 노출 시간은 약 1.4초(0.9초 유지 + 0.5초 fade).
  useEffect(() => {
    if (!choiceMessage) return;

    choiceResultOpacity.stopAnimation();
    choiceResultOpacity.setValue(1);

    const animation = Animated.sequence([
      Animated.delay(900),
      Animated.timing(choiceResultOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        setChoiceMessage(null);
        choiceResultOpacity.setValue(1);
      }
    });

    return () => {
      animation.stop();
    };
  }, [choiceMessage, choiceResultOpacity]);

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
  const isSecondTeamOfficial = matchDayType === "SECOND_TEAM_MATCH";
  const isAcademyEvaluation = matchDayType === "EVALUATION";
  const isRegularScrim = matchDayType === "SCRIM";
  const secondTeamMatch = isSecondTeamOfficial
    ? getSecondTeamMatchInfo(game)
    : null;
  const teamWinRate = getLiveWinProbability(game, match);
  const enemyWinRate = 100 - teamWinRate;

  async function choose(choice: ScrimChoice) {
    if (!game || !match) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const resolved = resolveScrimChoice(game, match, choice);

    setChoiceMessage(
      resolved.success
        ? `성공 · ${choice.title} 선택이 적중했습니다.`
        : `실패 · ${choice.title} 선택이 상대에게 읽혔습니다.`,
    );
    setMatch(resolved.state);
  }

  function signed(value: number) {
    return value > 0 ? `+${value}` : `${value}`;
  }

  function startNextOfficialSet() {
    if (!game || !match?.result) return;

    const result = match.result;
    const nextTeamWins = seriesTeamWins + (result.win ? 1 : 0);
    const nextEnemyWins = seriesEnemyWins + (result.win ? 0 : 1);

    setSeriesTeamWins(nextTeamWins);
    setSeriesEnemyWins(nextEnemyWins);

    if (playerInSet) {
      setSeriesPlayedSets((value) => value + 1);
      setSeriesPlayerKills((value) => value + result.playerKills);
      setSeriesPlayerDeaths((value) => value + result.playerDeaths);
      setSeriesPlayerAssists((value) => value + result.playerAssists);
      setSeriesPerformanceTotal((value) => value + result.performanceScore);
    } else {
      setSeriesStarterSets((value) => value + 1);
      setSeriesStarterKills((value) => value + result.playerKills);
      setSeriesStarterDeaths((value) => value + result.playerDeaths);
      setSeriesStarterAssists((value) => value + result.playerAssists);
      setSeriesStarterPerformanceTotal(
        (value) => value + result.performanceScore,
      );
    }

    const nextSetNumber = setNumber + 1;

    // LoL 규칙: 세트 도중에는 교체하지 않는다.
    // 방금 끝난 세트의 실제 경기력 + 기존 주전 경쟁 데이터를 바탕으로
    // 다음 세트 시작 전에만 코치진이 엔트리를 다시 결정한다.
    const lineupDecision = decideSecondTeamNextSetRole(
      game,
      playerInSet,
      {
        win: result.win,
        performanceScore: result.performanceScore,
      },
      nextSetNumber,
    );
    const nextPlayerInSet = lineupDecision.playerInSet;

    setPlayerInSet(nextPlayerInSet);

    // 세트 사이 엔트리가 실제로 바뀐 경우에만 안내한다.
    // "선발을 유지합니다." 같은 유지 안내는 경기 흐름을 끊으므로 표시하지 않는다.
    if (nextPlayerInSet !== playerInSet) {
      setChoiceMessage(lineupDecision.reason);
    } else {
      setChoiceMessage(null);
    }

    setSetNumber(nextSetNumber);

    const nextSetGame = nextPlayerInSet
      ? { ...game, actionSeed: game.actionSeed + nextSetNumber * 101 }
      : {
          ...game,
          actionSeed: game.actionSeed + nextSetNumber * 101,
          player: { ...game.player, name: `VORTEX ${game.player.position}` },
        };

    setMatch(createScrim(nextSetGame));
  }

  async function finishEvaluation() {
    if (!game || !match?.result) return;
    const result = match.result;

    const finalTeamWins = seriesTeamWins + (result.win ? 1 : 0);
    const finalEnemyWins = seriesEnemyWins + (result.win ? 0 : 1);
    const playedThisSet = isSecondTeamOfficial && playerInSet;
    const totalPlayedSets = seriesPlayedSets + (playedThisSet ? 1 : 0);
    const totalKills =
      seriesPlayerKills + (playedThisSet ? result.playerKills : 0);
    const totalDeaths =
      seriesPlayerDeaths + (playedThisSet ? result.playerDeaths : 0);
    const totalAssists =
      seriesPlayerAssists + (playedThisSet ? result.playerAssists : 0);
    const totalPerformance =
      seriesPerformanceTotal + (playedThisSet ? result.performanceScore : 0);

    const starterPlayedThisSet = isSecondTeamOfficial && !playerInSet;
    const totalStarterSets = seriesStarterSets + (starterPlayedThisSet ? 1 : 0);
    const totalStarterKills =
      seriesStarterKills + (starterPlayedThisSet ? result.playerKills : 0);
    const totalStarterDeaths =
      seriesStarterDeaths + (starterPlayedThisSet ? result.playerDeaths : 0);
    const totalStarterAssists =
      seriesStarterAssists + (starterPlayedThisSet ? result.playerAssists : 0);
    const totalStarterPerformance =
      seriesStarterPerformanceTotal +
      (starterPlayedThisSet ? result.performanceScore : 0);
    const starterStats =
      totalStarterSets > 0
        ? {
            sets: totalStarterSets,
            kills: totalStarterKills,
            deaths: totalStarterDeaths,
            assists: totalStarterAssists,
            performanceScore: Math.round(
              totalStarterPerformance / totalStarterSets,
            ),
          }
        : undefined;

    const seriesWin = finalTeamWins > finalEnemyWins;

    const next =
      isSecondTeamOfficial && totalPlayedSets === 0
        ? completeObservedSecondTeamMatch(game, {
            win: seriesWin,
            setWins: finalTeamWins,
            setLosses: finalEnemyWins,
            starterStats,
          }).state
        : isSecondTeamOfficial
          ? completeSecondTeamMatch(game, {
              win: seriesWin,
              playerKills: totalKills,
              playerDeaths: totalDeaths,
              playerAssists: totalAssists,
              performanceScore: Math.round(
                totalPerformance / Math.max(1, totalPlayedSets),
              ),
              setWins: finalTeamWins,
              setLosses: finalEnemyWins,
              starterStats,
            })
          : isAcademyEvaluation
            ? completeAcademyEvaluation(game, {
                grade: result.grade,
                performanceScore: result.performanceScore,
                win: result.win,
                coachTrustDelta: result.coachTrustDelta,
                starterCompetitionDelta: result.starterCompetitionDelta,
              })
            : completeAcademyScrim(game, {
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
    const projectedTeamWins = seriesTeamWins + (r.win ? 1 : 0);
    const projectedEnemyWins = seriesEnemyWins + (r.win ? 0 : 1);
    const officialSeriesFinished =
      isSecondTeamOfficial &&
      (projectedTeamWins >= 2 || projectedEnemyWins >= 2);

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.resultScreen}>
          <Text style={styles.kicker}>
            {isSecondTeamOfficial ? "SECOND TEAM LEAGUE" : "SCRIM COMPLETE"}
          </Text>
          <Text style={styles.resultHeadline}>
            {isSecondTeamOfficial
              ? officialSeriesFinished
                ? projectedTeamWins > projectedEnemyWins
                  ? "BO3 승리"
                  : "BO3 패배"
                : `${setNumber}세트 ${r.win ? "승리" : "패배"}`
              : r.win
                ? "스크림 승리"
                : "스크림 패배"}
          </Text>

          {isSecondTeamOfficial && (
            <View style={styles.seriesCard}>
              <Text style={styles.cardLabel}>BO3 · SET SCORE</Text>
              <Text style={styles.seriesScore}>
                VORTEX {projectedTeamWins} : {projectedEnemyWins}{" "}
                {secondTeamMatch?.opponent.name ?? "상대 2군"}
              </Text>
              <Text style={styles.smallText}>
                {setNumber}세트 종료 · 선수 교체는 세트 사이에만 가능합니다.
              </Text>
            </View>
          )}

          <View style={styles.scoreCard}>
            <Text style={styles.teamName}>
              {isSecondTeamOfficial ? "우리 2군" : "우리 ACADEMY"}
            </Text>
            <Text style={styles.finalScore}>
              {r.teamKills} : {r.enemyKills}
            </Text>
            <Text style={styles.teamName}>
              {secondTeamMatch?.opponent.name ?? "NOVA 2군"}
            </Text>
          </View>

          {!playerInSet ? (
            <View style={styles.kdaCard}>
              <Text style={styles.cardLabel}>벤치 관전</Text>
              <Text style={styles.kda}>FULL TIME</Text>
              <Text style={styles.smallText}>
                출전 기록 없이 팀 경기 결과만 시즌에 반영됩니다.
              </Text>
            </View>
          ) : (
            <View style={styles.kdaCard}>
              <Text style={styles.cardLabel}>개인 기록</Text>
              <Text style={styles.kda}>
                {r.playerKills} / {r.playerDeaths} / {r.playerAssists}
              </Text>
              <Text style={styles.smallText}>
                클러치 성공 {r.clutchSuccesses} / {r.clutchTotal}
              </Text>
            </View>
          )}

          {isAcademyEvaluation && (
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

          {playerInSet && (
            <View style={styles.coachCard}>
              <View style={styles.gradeRow}>
                <View>
                  <Text style={styles.cardLabel}>
                    {isSecondTeamOfficial
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
          )}

          <Pressable
            style={styles.primaryButton}
            onPress={
              isSecondTeamOfficial && !officialSeriesFinished
                ? startNextOfficialSet
                : finishEvaluation
            }
          >
            <Text style={styles.primaryButtonText}>
              {isSecondTeamOfficial && !officialSeriesFinished
                ? "다음 세트 준비"
                : !playerInSet
                  ? "관전 종료"
                  : isSecondTeamOfficial
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
            {isSecondTeamOfficial
              ? playerInSet
                ? `SECOND TEAM LEAGUE · SET ${setNumber}`
                : `SECOND TEAM LEAGUE · BENCH · SET ${setNumber}`
              : isRegularScrim
                ? "TEAM SCRIM"
                : "ACADEMY EVALUATION · MONTHLY"}
          </Text>
          <Text style={styles.headerTitle}>
            {isSecondTeamOfficial
              ? playerInSet
                ? `2군 공식전 · ${setNumber}세트 출전`
                : `2군 공식전 · ${setNumber}세트 벤치 관전`
              : isRegularScrim
                ? "정기 스크림"
                : "월간 아카데미 평가전"}
          </Text>
          <Text style={styles.headerSub}>
            {isSecondTeamOfficial && !playerInSet
              ? "벤치에서 세트 전체를 실시간 관전합니다. 선수 교체는 이 세트가 끝난 뒤에만 가능합니다."
              : isSecondTeamOfficial
                ? "공식전 · 경기 흐름은 자동 중계되며 중요한 순간에 직접 판단합니다."
                : "경기 상황은 자동으로 진행되고, 중요한 순간에만 직접 선택합니다."}
          </Text>
        </View>

        <View style={styles.scoreboard}>
          <View style={styles.team}>
            <Text style={styles.teamName}>
              {isSecondTeamOfficial ? "우리 2군" : "우리 ACADEMY"}
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
              {secondTeamMatch?.opponent.name ?? "NOVA 2군"}
            </Text>
            <Text style={styles.teamScore}>{match.enemyKills}</Text>
          </View>
        </View>

        <View style={styles.objectiveBoard}>
          <View style={styles.objectiveRow}>
            <Text style={styles.objectiveValue}>{match.teamDragons}</Text>
            <Text style={styles.objectiveLabel}>용</Text>
            <Text style={styles.objectiveValue}>{match.enemyDragons}</Text>
          </View>
          <View style={styles.objectiveRow}>
            <Text style={styles.objectiveValue}>{match.teamBarons}</Text>
            <Text style={styles.objectiveLabel}>바론</Text>
            <Text style={styles.objectiveValue}>{match.enemyBarons}</Text>
          </View>
          <View style={styles.objectiveRow}>
            <Text style={styles.objectiveValue}>{match.teamTowers}</Text>
            <Text style={styles.objectiveLabel}>포탑</Text>
            <Text style={styles.objectiveValue}>{match.enemyTowers}</Text>
          </View>
          {(match.teamElders > 0 || match.enemyElders > 0) && (
            <View style={styles.objectiveRow}>
              <Text style={styles.objectiveValue}>{match.teamElders}</Text>
              <Text style={styles.objectiveLabel}>장로</Text>
              <Text style={styles.objectiveValue}>{match.enemyElders}</Text>
            </View>
          )}

          <View style={styles.winRateHeader}>
            <Text style={styles.winRateLabel}>실시간 승률</Text>
            <Text style={styles.winRateText}>
              {teamWinRate}% : {enemyWinRate}%
            </Text>
          </View>
          <View style={styles.winRateTrack}>
            <View style={[styles.winRateFill, { width: `${teamWinRate}%` }]} />
          </View>
        </View>

        {!playerInSet ? (
          <View style={styles.playerLine}>
            <Text style={styles.playerLineLabel}>BENCH</Text>
            <Text style={styles.playerLineValue}>관전 중 · 미출전</Text>
          </View>
        ) : (
          <View style={styles.playerLine}>
            <Text style={styles.playerLineLabel}>{game.player.position}</Text>
            <Text style={styles.playerLineValue}>
              {match.playerKills} / {match.playerDeaths} / {match.playerAssists}
            </Text>
          </View>
        )}

        <View style={styles.gameArea}>
          {playerInSet && moment ? (
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
                <Text style={styles.autoLabel}>1.2초 자동 진행</Text>
              </View>

              {choiceMessage && playerInSet && (
                <Animated.View
                  style={[
                    styles.choiceResultCard,
                    { opacity: choiceResultOpacity },
                  ]}
                >
                  <Text style={styles.choiceResultLabel}>내 선택 결과</Text>
                  <Text style={styles.choiceResult}>{choiceMessage}</Text>
                </Animated.View>
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
                {(match.commentaryLog ?? [])
                  .filter(
                    (item) =>
                      playerInSet || !item.text.startsWith("__CHOICE__"),
                  )
                  .map((item, index) => (
                    <View
                      key={`${item.minute}-${item.second ?? 0}-${index}`}
                      style={styles.commentaryRow}
                    >
                      <Text style={styles.commentaryTime}>
                        {String(item.minute).padStart(2, "0")}:
                        {String(item.second ?? 0).padStart(2, "0")}
                      </Text>
                      <Text
                        style={[
                          styles.commentaryLine,
                          item.text.startsWith("__CHOICE__") &&
                            styles.choiceCommentaryLine,
                        ]}
                      >
                        {item.text.replace("__CHOICE__", "")}
                      </Text>
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
  screen: { flex: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#FFF", fontWeight: "900" },

  header: { paddingTop: 2, paddingBottom: 10 },
  kicker: { color: LIME, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  headerTitle: { color: "#FFF", fontSize: 25, fontWeight: "900", marginTop: 2 },
  headerSub: {
    color: "#7E8994",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },

  scoreboard: {
    height: 96,
    borderRadius: 20,
    backgroundColor: "#161C22",
    borderWidth: 1,
    borderColor: "#29313A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 12,
  },
  objectiveBoard: {
    marginHorizontal: 10,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#12151B",
    borderWidth: 1,
    borderColor: "#252A33",
  },
  objectiveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 20,
  },
  objectiveValue: {
    width: 42,
    color: "#FFF",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  objectiveLabel: {
    color: "#8F98A8",
    fontSize: 12,
    fontWeight: "800",
  },
  winRateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 4,
  },
  winRateLabel: {
    color: "#8F98A8",
    fontSize: 11,
    fontWeight: "800",
  },
  winRateText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
  },
  winRateTrack: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#303640",
  },
  winRateFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: LIME,
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
    marginTop: 7,
    height: 40,
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
    marginTop: 8,
    borderRadius: 18,
    backgroundColor: "#151A20",
    borderWidth: 1,
    borderColor: "#252D35",
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "center",
  },
  clutchLabel: {
    color: "#FFB84D",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  momentTitle: { color: "#FFF", fontSize: 21, fontWeight: "900", marginTop: 3 },
  situation: {
    color: "#AAB2BA",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 5,
  },
  choiceList: { marginTop: 12, gap: 7 },
  choice: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#303943",
    backgroundColor: "#1B2229",
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  seriesCard: {
    backgroundColor: "#151515",
    borderWidth: 1,
    borderColor: "#2B2B2B",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  seriesScore: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 5,
    marginBottom: 4,
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
  choiceCommentaryLine: {
    color: LIME,
    fontWeight: "900",
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
