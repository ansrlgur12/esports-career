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

import Avatar from "../components/Avatar";
import { calculateOvr, statLabels, xpNeeded } from "../game/engine";
import { loadGame } from "../storage/db";
import { GameState, StatKey } from "../types/game";

const LIME = "#B7FF2A";

const STAT_GROUPS: { title: string; stats: StatKey[] }[] = [
  {
    title: "기계적 능력",
    stats: ["physical", "reaction", "accuracy", "movement", "focus"],
  },
  {
    title: "라인전",
    stats: ["laning", "cs", "killSense", "survival", "champPool"],
  },
  {
    title: "게임 IQ",
    stats: ["macro", "vision", "decision", "objective", "teamfight"],
  },
  {
    title: "팀",
    stats: ["calling", "synergy", "mental"],
  },
];

export default function PlayerScreen() {
  const [game, setGame] = useState<GameState | null>(null);

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

  if (!game) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>선수 정보를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const player = game.player;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>선수 정보</Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              <Avatar
                avatar={player.avatar}
                size={150}
                backgroundColor="#16212D"
                borderRadius={0}
              />
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.playerMeta}>
                {player.age}세 · {player.position} · {player.careerStage}
              </Text>

              <View style={styles.positionBadge}>
                <Text style={styles.positionText}>{player.position}</Text>
              </View>
            </View>

            <View style={styles.ovrBox}>
              <Text style={styles.ovrNumber}>
                {calculateOvr(game.player.stats, game.player.position)}
              </Text>
              <Text style={styles.ovrLabel}>OVR</Text>
            </View>
          </View>

          {STAT_GROUPS.map((group) => (
            <View key={group.title} style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>

              <View style={styles.statCard}>
                {group.stats.map((stat, index) => (
                  <StatRow
                    key={stat}
                    stat={stat}
                    level={player.stats[stat]}
                    xp={player.xp[stat]}
                    isLast={index === group.stats.length - 1}
                  />
                ))}
              </View>
            </View>
          ))}

          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function getStatScaleMax(stat: number) {
  if (stat < 100) return 100;
  return Math.ceil((stat + 1) / 20) * 20;
}

function StatRow({
  stat,
  level,
  xp,
  isLast,
}: {
  stat: StatKey;
  level: number;
  xp: number;
  isLast: boolean;
}) {
  const scaleMax = getStatScaleMax(level);
  const needed = xpNeeded(level);

  const progress = Math.min(100, (level / scaleMax) * 100);
  const width = `${progress}%` as `${number}%`;

  return (
    <View style={[styles.statRow, isLast && styles.statRowLast]}>
      <View style={styles.statTop}>
        <Text style={styles.statName}>{statLabels[stat]}</Text>

        <View style={styles.statValueWrap}>
          <Text style={styles.statLevel}>{level}</Text>
          <Text style={styles.statScale}> / {scaleMax}</Text>
        </View>
      </View>

      <View style={styles.xpRow}>
        <View style={styles.xpBar}>
          <View style={[styles.xpFill, { width }]} />
        </View>
      </View>

      <Text style={styles.nextXpText}>
        다음 성장 {xp.toLocaleString()} / {needed.toLocaleString()} XP
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#000",
  },

  screen: {
    flex: 1,
    backgroundColor: "#000",
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#8D97A1",
    fontSize: 13,
    fontWeight: "700",
  },

  header: {
    height: 58,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#171C21",
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  backText: {
    color: "#FFF",
    fontSize: 36,
    lineHeight: 38,
    fontWeight: "400",
    marginTop: -3,
  },

  headerTitle: {
    flex: 1,
    color: "#FFF",
    textAlign: "center",
    fontSize: 17,
    fontWeight: "900",
  },

  headerSpacer: {
    width: 40,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  profileCard: {
    minHeight: 170,
    borderRadius: 22,
    backgroundColor: "#11181E",
    borderWidth: 1,
    borderColor: "#25303A",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 16,
  },

  avatarWrap: {
    width: 145,
    height: 170,
    backgroundColor: "#16212D",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  profileInfo: {
    flex: 1,
    paddingLeft: 14,
  },

  playerName: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "900",
  },

  playerMeta: {
    color: "#AAB2BA",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },

  positionBadge: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#202A32",
    alignItems: "center",
    justifyContent: "center",
  },

  positionText: {
    color: LIME,
    fontSize: 11,
    fontWeight: "900",
  },

  ovrBox: {
    width: 62,
    height: 74,
    borderRadius: 16,
    backgroundColor: "#070A0D",
    alignItems: "center",
    justifyContent: "center",
  },

  ovrNumber: {
    color: LIME,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "900",
  },

  ovrLabel: {
    color: "#89939D",
    fontSize: 9,
    fontWeight: "900",
    marginTop: 2,
  },

  group: {
    marginTop: 20,
  },

  groupTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 8,
    paddingLeft: 2,
  },

  statCard: {
    borderRadius: 18,
    backgroundColor: "#0E0E0F",
    borderWidth: 1,
    borderColor: "#242C33",
    paddingHorizontal: 14,
  },

  statRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C2227",
  },

  statRowLast: {
    borderBottomWidth: 0,
  },

  statTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statName: {
    color: "#DDE2E6",
    fontSize: 13,
    fontWeight: "800",
  },

  statValueWrap: {
    flexDirection: "row",
    alignItems: "baseline",
  },

  statLevel: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "900",
  },

  statScale: {
    color: "#6F7983",
    fontSize: 10,
    fontWeight: "800",
  },

  xpRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  xpBar: {
    flex: 1,
    height: 7,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#272C30",
  },

  xpFill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: LIME,
  },

  nextXpText: {
    color: "#6F7983",
    fontSize: 9,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 5,
  },

  bottomSpace: {
    height: 30,
  },
});
