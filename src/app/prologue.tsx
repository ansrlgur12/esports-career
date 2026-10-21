import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import Avatar from "../components/Avatar";
import { loadGame } from "../storage/db";
import type { GameState } from "../types/game";

export default function PrologueScreen() {
  const [game, setGame] = useState<GameState | null>(null);
  const [scene, setScene] = useState(0);

  useEffect(() => {
    loadGame().then((saved) => {
      if (!saved) router.replace("/create");
      else setGame(saved);
    });
  }, []);

  const scenes = useMemo(
    () =>
      game
        ? [
            {
              tag: "PC BANG TOURNAMENT · FINAL",
              title: "마지막 한타",
              body: `동네 PC방 아마추어 대회 결승. ${game.player.name}은(는) ${game.player.position} 포지션으로 마지막 교전을 뒤집었다.`,
            },
            {
              tag: "CHAMPION",
              title: "우승",
              body: "넥서스가 무너지고 작은 PC방이 환호로 가득 찬다. 이름 없는 아마추어 팀이 대회 우승을 차지했다.",
            },
            {
              tag: "AFTER THE MATCH",
              title: "누군가 지켜보고 있었다",
              body: `경기가 끝난 뒤 한 남자가 ${game.player.name}에게 다가온다. 경기 내내 뒤쪽에서 플레이를 지켜보던 사람이었다.`,
            },
            {
              tag: "SCOUT",
              title: "프로팀 스카우터",
              body: `“${game.player.position} 플레이 인상 깊게 봤습니다. 아직 다듬을 부분은 많지만 가능성이 있어요.”`,
            },
            {
              tag: "VORTEX ACADEMY",
              title: "첫 번째 제안",
              body: "“VORTEX 아카데미에서 제대로 경쟁해볼 생각 있습니까?” 그렇게 첫 프로 커리어의 문이 열린다.",
            },
          ]
        : [],
    [game],
  );

  if (!game) return <SafeAreaView style={styles.safe} />;
  const current = scenes[scene];
  const last = scene === scenes.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={styles.top}>
          <Text style={styles.chapter}>PROLOGUE</Text>
          <Text style={styles.step}>
            {scene + 1} / {scenes.length}
          </Text>
        </View>
        <View style={styles.stage}>
          <Avatar
            avatar={game.player.avatar}
            size={250}
            backgroundColor="transparent"
            borderRadius={0}
          />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{game.player.position}</Text>
          </View>
        </View>
        <View style={styles.story}>
          <Text style={styles.tag}>{current.tag}</Text>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.body}>{current.body}</Text>
        </View>
        <Pressable
          style={styles.next}
          onPress={() =>
            last ? router.replace("/home") : setScene((v) => v + 1)
          }
        >
          <Text style={styles.nextText}>{last ? "아카데미 입단" : "계속"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
const LIME = "#B7FF2A";
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#050708" },
  screen: { flex: 1, padding: 20, paddingTop: 18 },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chapter: { color: LIME, fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  step: { color: "#76818B", fontSize: 12, fontWeight: "800" },
  stage: {
    height: 330,
    marginTop: 18,
    borderRadius: 24,
    backgroundColor: "#11171C",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#28323B",
  },
  badge: {
    position: "absolute",
    left: 16,
    bottom: 16,
    borderRadius: 10,
    backgroundColor: "#168CFF",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: { color: "#FFF", fontWeight: "900" },
  story: { flex: 1, paddingTop: 28 },
  tag: {
    color: "#7E8994",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  title: { color: "#FFF", fontSize: 30, fontWeight: "900", marginTop: 7 },
  body: {
    color: "#D4DAE0",
    fontSize: 17,
    lineHeight: 27,
    fontWeight: "700",
    marginTop: 16,
  },
  next: {
    height: 62,
    borderRadius: 18,
    backgroundColor: LIME,
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: { color: "#071000", fontSize: 18, fontWeight: "900" },
});
