import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    ImageBackground,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import Avatar from "../components/Avatar";
import {
    applyAction,
    calculateOvr,
    generateActions,
    getDayLabel,
    getSecondTeamMatchInfo,
    getUpcomingSchedule,
    recoveryRemaining,
    statLabels,
    useFullRecovery,
    xpNeeded,
} from "../game/engine";
import { loadGame, saveGame } from "../storage/db";
import { GameState, StatKey } from "../types/game";

const slotLabel = {
  MORNING: "오전",
  AFTERNOON: "오후",
  EVENING: "저녁",
} as const;

import { getMainBackground } from "../game/background";

function formatSalary(value: number) {
  if (value >= 100000000) {
    const eok = value / 100000000;
    return `₩${Number.isInteger(eok) ? eok : eok.toFixed(1)}억`;
  }
  return `₩${Math.round(value / 10000).toLocaleString()}만`;
}

export default function HomeScreen() {
  const [game, setGame] = useState<GameState | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [actionResult, setActionResult] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      loadGame().then((data) => {
        if (mounted) setGame(data);
      });

      return () => {
        mounted = false;
      };
    }, []),
  );

  async function chooseAction(index: number) {
    if (!game || isResolving) return;

    setIsResolving(true);

    try {
      const actions = generateActions(game);
      const action = actions[index];
      if (!action) return;

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const next = applyAction(game, action);

      const statResults = Object.keys(action.xp).map((key) => {
        const stat = key as StatKey;

        const beforeLevel = game.player.stats[stat];
        const afterLevel = next.player.stats[stat];

        const beforeXp = game.player.xp[stat];
        const afterXp = next.player.xp[stat];

        /*
         * 실제 획득 EXP 계산.
         * 레벨업한 경우 소비된 EXP까지 다시 더해서 계산.
         */
        let gainedXp = afterXp - beforeXp;

        let level = beforeLevel;

        while (level < afterLevel) {
          gainedXp += xpNeeded(level);
          level++;
        }

        return {
          stat,
          label: statLabels[stat],

          beforeLevel,
          afterLevel,

          beforeXp,
          afterXp,

          gainedXp,

          beforeNeeded: xpNeeded(beforeLevel),
          afterNeeded: xpNeeded(afterLevel),
        };
      });

      setActionResult({
        name: action.name,
        stats: statResults,

        stamina: next.player.stamina - game.player.stamina,
        condition: next.player.condition - game.player.condition,
        stress: next.player.stress - game.player.stress,
      });

      // 결과창 1초 표시
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 1400);
      });

      setActionResult(null);
      setGame(next);
      await saveGame(next);
    } finally {
      setIsResolving(false);
    }
  }

  async function recover() {
    if (!game || isResolving) return;

    const next = useFullRecovery(game);
    setGame(next);
    await saveGame(next);
  }

  if (!game) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.logoSmall}>PRO CAREER</Text>
          <Text style={styles.logo}>ROAD TO{"\n"}LEGEND</Text>

          <Pressable
            style={styles.newButton}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.newButtonText}>커리어 선택으로</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const actions = generateActions(game);
  const remaining = recoveryRemaining(game);
  const today = getDayLabel(game);
  const upcoming = getUpcomingSchedule(game);
  const seasonStats = game.player.seasonStats ?? {
    games: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
  };
  const seasonKda =
    seasonStats.deaths === 0
      ? seasonStats.kills + seasonStats.assists
      : (seasonStats.kills + seasonStats.assists) / seasonStats.deaths;
  const academySeason = game.player.secondTeamSeason;
  const secondTeamMatch =
    game.player.careerStage === "SECOND_TEAM"
      ? getSecondTeamMatchInfo(game)
      : null;
  const morningEventPending =
    game.slot === "MORNING" &&
    game.player.morningEventCompletedDate !== game.date &&
    (today.dayType === "EVALUATION" ||
      today.dayType === "SCRIM" ||
      today.dayType === "SECOND_TEAM_MATCH");
  const backgroundSource = getMainBackground(game, today.dayType);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={styles.hero}>
          <ImageBackground
            source={backgroundSource}
            style={styles.heroBackground}
            imageStyle={styles.heroBackgroundImage}
            resizeMode="cover"
          >
            <Avatar
              avatar={game.player.avatar}
              size={310}
              backgroundColor="transparent"
              borderRadius={0}
            />
          </ImageBackground>

          <View style={styles.dateBlock}>
            <Text style={styles.date}>
              {game.date.slice(5).replace("-", "/")} ({today.weekdayLabel}){" "}
              <Text style={styles.slot}>{slotLabel[game.slot]}</Text>
            </Text>

            <Pressable
              disabled={game.player.careerStage !== "ACADEMY"}
              onPress={() => router.push("/academy")}
              hitSlop={8}
            >
              <Text style={styles.stage}>
                {game.player.careerStage === "SECOND_TEAM"
                  ? "2군 리그"
                  : "아카데미 경쟁"}{" "}
                · {game.player.age}세{" "}
                {game.player.careerStage === "SECOND_TEAM"
                  ? "2군"
                  : "아카데미 · 상세"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.playerBlock}>
            <Text style={styles.playerName}>{game.player.name}</Text>
            <Text style={styles.playerMeta}>
              {game.player.age}세 · {game.player.position} ·{" "}
              {game.player.careerStage}
            </Text>
            <Text style={styles.salary}>
              연봉 {formatSalary(game.player.annualSalary ?? 24000000)}
            </Text>
            <Pressable
              disabled={game.player.careerStage !== "ACADEMY"}
              onPress={() => router.push("/academy")}
            >
              <Text style={styles.seasonKda}>
                시즌 KDA {seasonKda.toFixed(2)} · {seasonStats.kills}/
                {seasonStats.deaths}/{seasonStats.assists}
                {game.player.careerStage === "SECOND_TEAM"
                  ? " · 시즌 상세"
                  : ""}
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.ovr}
            onPress={() => router.push("/player")}
            hitSlop={10}
          >
            <Text style={styles.ovrPosition}>{game.player.position}</Text>
            <Text style={styles.ovrNumber}>
              {calculateOvr(game.player.stats, game.player.position)}
            </Text>
            <Text style={styles.ovrLabel}>OVR · 상세보기</Text>
          </Pressable>
        </View>

        <View style={styles.statusArea}>
          {actionResult ? (
            <View style={styles.resultArea}>
              <Text style={styles.resultTitle}>{actionResult.name}</Text>

              <View style={styles.resultStats}>
                {actionResult.stats.map((result: any) => (
                  <StatResultRow key={result.stat} result={result} />
                ))}
              </View>

              <View style={styles.resultStatus}>
                <Text style={styles.resultStatusText}>
                  체력{" "}
                  <Text style={{ color: deltaColor(actionResult.stamina) }}>
                    {formatDelta(actionResult.stamina)}
                  </Text>
                </Text>

                <Text style={styles.resultStatusText}>
                  컨디션{" "}
                  <Text style={{ color: deltaColor(actionResult.condition) }}>
                    {formatDelta(actionResult.condition)}
                  </Text>
                </Text>

                <Text style={styles.resultStatusText}>
                  스트레스{" "}
                  <Text
                    style={{ color: stressDeltaColor(actionResult.stress) }}
                  >
                    {formatDelta(actionResult.stress)}
                  </Text>
                </Text>
              </View>
            </View>
          ) : (
            <>
              <StatusRow
                label="체력"
                value={game.player.stamina}
                type="stamina"
              />

              <StatusRow
                label="컨디션"
                value={game.player.condition}
                type="condition"
              />

              <StatusRow
                label="스트레스"
                value={game.player.stress}
                type="stress"
              />

              <Pressable
                style={[
                  styles.recover,
                  remaining === 0 && styles.recoverDisabled,
                ]}
                disabled={remaining === 0}
                onPress={recover}
              >
                <Text style={styles.recoverTitle}>완전회복</Text>
                <Text style={styles.recoverCount}>{remaining} / 2</Text>
              </Pressable>
            </>
          )}
        </View>

        {game.player.careerStage === "ACADEMY" &&
        game.player.secondTeamCallupReady ? (
          <View style={styles.evaluationOnly}>
            <View style={styles.evaluationInfo}>
              <Text style={styles.eventLabel}>SPECIAL EVENT</Text>
              <Text style={styles.evaluationTitle}>2군 콜업</Text>
              <Text style={styles.eventDate}>
                코치가 2군 콜업 면담을 요청했습니다.
              </Text>
            </View>
            <Pressable
              style={styles.scrimStartButton}
              disabled={isResolving}
              onPress={() => router.push("/callup")}
            >
              <Text style={styles.scrimStartButtonText}>콜업 면담 시작</Text>
            </Pressable>
          </View>
        ) : morningEventPending && today.dayType === "EVALUATION" ? (
          <View style={styles.evaluationOnly}>
            <View style={styles.evaluationInfo}>
              <Text style={styles.eventLabel}>월간 아카데미 평가</Text>
              <Text style={styles.evaluationTitle}>평가 스크림</Text>
              <Text style={styles.eventDate}>
                오전 일정 · 평가 종료 후 오후와 저녁은 평소 일정으로 진행합니다.
              </Text>
            </View>
            <Pressable
              style={styles.scrimStartButton}
              disabled={isResolving}
              onPress={() => router.push("/match")}
            >
              <Text style={styles.scrimStartButtonText}>연습경기 시작</Text>
            </Pressable>
          </View>
        ) : morningEventPending && today.dayType === "SCRIM" ? (
          <View style={styles.evaluationOnly}>
            <View style={styles.evaluationInfo}>
              <Text style={styles.eventLabel}>TEAM SCRIM</Text>
              <Text style={styles.evaluationTitle}>정기 스크림</Text>
              <Text style={styles.eventDate}>
                오전 일정 · 종료 후 오후와 저녁은 평소 일정으로 진행합니다.
              </Text>
            </View>
            <Pressable
              style={styles.scrimStartButton}
              disabled={isResolving}
              onPress={() => router.push("/match")}
            >
              <Text style={styles.scrimStartButtonText}>스크림 시작</Text>
            </Pressable>
          </View>
        ) : morningEventPending && today.dayType === "SECOND_TEAM_MATCH" ? (
          <View style={styles.evaluationOnly}>
            <View style={styles.evaluationInfo}>
              <Text style={styles.eventLabel}>
                OFFICIAL MATCH · {secondTeamMatch?.round}R
              </Text>
              <Text style={styles.evaluationTitle}>
                우리 2군 vs {secondTeamMatch?.opponent.name}
              </Text>
              <Text style={styles.eventDate}>
                전력 {secondTeamMatch?.teamPower} vs{" "}
                {secondTeamMatch?.opponent.power} · 공식전 기록 반영
              </Text>
            </View>
            <Pressable
              style={styles.scrimStartButton}
              disabled={isResolving}
              onPress={() => router.push("/match")}
            >
              <Text style={styles.scrimStartButtonText}>경기 시작</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actionHeader}>
            {upcoming ? (
              <>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventLabel}>다가오는 이벤트</Text>
                  <Text style={styles.eventTitle}>{upcoming.title}</Text>
                  <Text style={styles.eventDate}>
                    {upcoming.date.slice(5).replace("-", "/")} (
                    {upcoming.weekdayLabel})
                  </Text>
                </View>
                <Text style={styles.eventDday}>D-{upcoming.daysAway}</Text>
              </>
            ) : (
              <Text style={styles.noEvent}>예정된 이벤트 없음</Text>
            )}
          </View>
        )}
        {!morningEventPending && !game.player.secondTeamCallupReady && (
          <View style={styles.actionGrid}>
            {actions.map((action, index) => (
              <Pressable
                key={action.id}
                style={styles.actionCard}
                disabled={isResolving}
                onPress={() => chooseAction(index)}
              >
                <View style={styles.actionTop}>
                  <Text style={styles.actionName} numberOfLines={1}>
                    {action.name}
                  </Text>

                  <Text
                    style={[
                      styles.hp,
                      action.stamina >= 0 && styles.hpPositive,
                    ]}
                  >
                    {action.stamina >= 20
                      ? "HP ▲▲"
                      : action.stamina > 0
                        ? "HP ▲"
                        : action.stamina <= -12
                          ? "HP ▼▼"
                          : "HP ▼"}
                  </Text>
                </View>

                <Text style={styles.actionDesc} numberOfLines={2}>
                  {action.id === "sleep"
                    ? "하루를 마치고 충분히 수면합니다."
                    : action.id === "rest"
                      ? "체력과 컨디션을 회복합니다."
                      : "관련 능력치를 중심으로 성장합니다."}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function stressDeltaColor(value: number) {
  if (value > 0) return "#FF5C64"; // 스트레스 증가 = 나쁨
  if (value < 0) return LIME; // 스트레스 감소 = 좋음
  return "#AAB1B9";
}

function deltaColor(value: number) {
  if (value > 0) return LIME;
  if (value < 0) return "#FF5C64";
  return "#AAB1B9";
}

function formatDelta(value: number) {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function StatResultRow({ result }: { result: any }) {
  const leveledUp = result.afterLevel > result.beforeLevel;
  const beforeProgress =
    result.beforeNeeded > 0
      ? Math.min(100, (result.beforeXp / result.beforeNeeded) * 100)
      : 0;
  const afterProgress =
    result.afterNeeded > 0
      ? Math.min(100, (result.afterXp / result.afterNeeded) * 100)
      : 0;

  // 레벨업 시 새 레벨의 EXP 바는 0%부터, 아니면 기존 진행도부터 차오른다.
  const startProgress = leveledUp ? 0 : beforeProgress;
  const animatedProgress = useRef(new Animated.Value(startProgress)).current;

  useEffect(() => {
    animatedProgress.setValue(startProgress);
    Animated.timing(animatedProgress, {
      toValue: afterProgress,
      duration: 750,
      useNativeDriver: false,
    }).start();
  }, [afterProgress, startProgress, animatedProgress]);

  const width = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.statResultRow}>
      <View style={styles.statResultTop}>
        <Text style={styles.statResultName}>{result.label}</Text>

        <Text style={styles.statResultLevel}>
          {leveledUp ? (
            <>
              {result.beforeLevel}
              <Text style={styles.levelArrow}> → </Text>
              <Text style={styles.levelUp}>{result.afterLevel} ↑</Text>
            </>
          ) : (
            result.afterLevel
          )}
        </Text>

        <Text style={styles.statResultGain}>+{result.gainedXp} XP</Text>
      </View>

      <View style={styles.statXpRow}>
        <View style={styles.statXpBar}>
          <Animated.View style={[styles.statXpFill, { width }]} />
        </View>

        <Text style={styles.statXpValue}>
          {result.afterXp} / {result.afterNeeded}
        </Text>
      </View>
    </View>
  );
}

function StatusRow({
  label,
  value,
  type,
}: {
  label: string;
  value: number;
  type: "stamina" | "condition" | "stress";
}) {
  const width = `${Math.max(0, Math.min(100, value))}%` as `${number}%`;

  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>{label}</Text>

      <View style={styles.bar}>
        <View style={[styles.fill, styles[type], { width }]} />
      </View>

      <Text style={styles.statusValue}>{value}</Text>
    </View>
  );
}

const LIME = "#B7FF2A";

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#000",
  },
  screen: {
    flex: 1,
    backgroundColor: "#000",
  },
  empty: {
    flex: 1,
    padding: 30,
    justifyContent: "center",
  },
  logoSmall: {
    color: "#808B99",
    fontWeight: "900",
    letterSpacing: 3,
  },
  logo: {
    color: "#FFF",
    fontSize: 52,
    lineHeight: 55,
    fontWeight: "900",
    marginTop: 8,
  },
  newButton: {
    height: 70,
    borderRadius: 22,
    backgroundColor: LIME,
    justifyContent: "center",
    paddingHorizontal: 24,
    marginTop: 70,
  },
  newButtonText: {
    color: "#081000",
    fontSize: 24,
    fontWeight: "900",
  },

  hero: {
    height: "35%",
    minHeight: 250,
    backgroundColor: "#16212D",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  dateBlock: {
    position: "absolute",
    top: 24,
    left: 20,
    zIndex: 10,
  },
  date: {
    color: "#FFF",
    fontSize: 24, // 29 → 24
    fontWeight: "900",
  },
  slot: {
    color: LIME,
  },
  stage: {
    color: "#E3E8ED",
    fontSize: 12, // 14 → 12
    fontWeight: "700",
    marginTop: 2,
  },

  playerBlock: {
    position: "absolute",
    left: 20,
    bottom: 18,
    zIndex: 10,
  },
  playerName: {
    color: "#FFF",
    fontSize: 27, // 33 → 27
    fontWeight: "900",
  },

  playerMeta: {
    color: "#D4DAE0",
    fontSize: 11, // 13 → 11
    fontWeight: "800",
  },
  seasonKda: {
    color: "#AAB1B9",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 3,
  },

  ovr: {
    position: "absolute",
    right: 16,
    bottom: 18,
    width: 82,
    height: 98,
    borderRadius: 20,
    backgroundColor: "rgba(5,10,15,.88)",
    alignItems: "center",
    justifyContent: "center",
  },
  ovrPosition: {
    color: "#D7DCE2",
    fontWeight: "900",
    fontSize: 11, // 13 → 11
  },

  ovrNumber: {
    color: LIME,
    fontWeight: "900",
    fontSize: 32, // 39 → 32
    lineHeight: 35, // 42 → 35
  },

  ovrLabel: {
    color: "#AAB1B9",
    fontWeight: "900",
    fontSize: 9, // 11 → 9
  },

  statusArea: {
    height: 88,
    paddingLeft: 20,
    paddingRight: 94,
    paddingTop: 5,
    position: "relative",
    marginBottom: 10,

    zIndex: 20,
    overflow: "visible",
  },

  statusRow: {
    height: 25, // 31 → 25
    flexDirection: "row",
    alignItems: "center",
    gap: 6, // 9 → 6
  },
  statusLabel: {
    width: 50, // 55 → 50
    color: "#BFC5CC",
    fontSize: 12,
  },
  bar: {
    flex: 0.9,
    height: 8, // 10 → 8
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#262A2E",
  },

  statusValue: {
    width: 25,
    color: "#FFF",
    textAlign: "right",
    fontSize: 13,
    fontWeight: "900",
  },
  fill: {
    height: "100%",
    borderRadius: 10,
  },
  stamina: {
    backgroundColor: LIME,
  },
  condition: {
    backgroundColor: "#3BC3F4",
  },
  stress: {
    backgroundColor: "#FF9D2E",
  },
  recover: {
    position: "absolute",
    right: 16,
    top: 8,

    width: 72,
    height: 64, // 94 → 64

    borderRadius: 16,
    borderWidth: 2,
    borderColor: LIME,

    alignItems: "center",
    justifyContent: "center",
  },

  recoverTitle: {
    color: LIME,
    fontSize: 11,
    fontWeight: "900",
  },

  recoverCount: {
    color: LIME,
    fontSize: 18, // 23 → 18
    fontWeight: "900",
    marginTop: 1,
  },

  evaluationOnly: {
    minHeight: 82,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#161B20",
    borderWidth: 1,
    borderColor: LIME,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  evaluationInfo: {
    flex: 1,
    paddingRight: 12,
  },

  evaluationTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 2,
  },

  scrimStartButton: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: LIME,
    alignItems: "center",
    justifyContent: "center",
  },

  scrimStartButtonText: {
    color: "#071000",
    fontSize: 12,
    fontWeight: "900",
  },

  actionHeader: {
    height: 72,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#161B20",
    borderWidth: 1,
    borderColor: "#252C33",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  eventReady: {
    borderColor: LIME,
  },

  eventInfo: {
    flex: 1,
  },

  eventLabel: {
    color: "#7F8993",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  eventTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2,
  },

  eventDate: {
    color: "#7F8993",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 1,
  },

  eventDday: {
    color: LIME,
    fontSize: 24,
    fontWeight: "900",
    marginLeft: 12,
  },

  noEvent: {
    color: "#7F8993",
    fontSize: 12,
    fontWeight: "800",
  },

  actionGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  actionCard: {
    width: "48.7%",
    flexGrow: 1,
    flexBasis: "47%",
    borderWidth: 1,
    borderColor: "#28333D",
    borderRadius: 19,
    padding: 14,
    backgroundColor: "#0E0E0F",
    justifyContent: "center",
  },
  actionTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 5,
  },
  actionName: {
    flex: 1,
    color: "#FFF",
    fontSize: 17,
    fontWeight: "900",
  },
  hp: {
    color: "#FF5C64",
    fontSize: 12,
    fontWeight: "900",
  },
  hpPositive: {
    color: LIME,
  },
  actionDesc: {
    color: "#939CA6",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 9,
  },
  resultArea: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,

    zIndex: 100,
    elevation: 20,

    backgroundColor: "#121212",
    borderRadius: 20,
    padding: 16,

    borderWidth: 1,
    borderColor: "#242424",
  },

  resultTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 6,
  },

  resultStats: {
    gap: 4,
  },

  statResultRow: {
    width: "100%",
  },

  statResultTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  statResultName: {
    width: 65,
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
  },

  statResultLevel: {
    width: 65,
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
  },

  levelArrow: {
    color: "#77818C",
  },

  levelUp: {
    color: LIME,
    fontWeight: "900",
  },

  statResultGain: {
    marginLeft: "auto",
    color: LIME,
    fontSize: 11,
    fontWeight: "900",
  },

  statXpRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },

  statXpBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#262A2E",
    borderRadius: 10,
    overflow: "hidden",
  },

  statXpFill: {
    height: "100%",
    backgroundColor: LIME,
    borderRadius: 10,
  },

  statXpValue: {
    width: 82,
    marginLeft: 7,
    color: "#89939D",
    fontSize: 9,
    textAlign: "right",
    fontWeight: "700",
  },

  resultStat: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "800",
  },

  resultPlus: {
    color: LIME,
    fontWeight: "900",
  },

  resultStatus: {
    flexDirection: "row",
    gap: 12,
    marginTop: 7,
  },

  resultStatusText: {
    color: "#AAB1B9",
    fontSize: 12,
    fontWeight: "800",
  },

  recoverDisabled: {
    opacity: 0.35,
  },
  salary: {
    color: "#C8FF37",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 4,
  },
  heroBackground: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  heroBackgroundImage: {
    width: "100%",
    height: "100%",
  },
});
