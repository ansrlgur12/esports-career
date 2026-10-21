import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Avatar from "../components/Avatar";
import {
  CareerSummary,
  deleteCareer,
  listCareers,
  setActiveCareer,
} from "../storage/db";

function stageLabel(stage: CareerSummary["careerStage"]) {
  if (stage === "FIRST_TEAM") return "1군";
  if (stage === "SECOND_TEAM") return "2군";
  return "아카데미";
}

export default function CareerSelectScreen() {
  const [careers, setCareers] = useState<CareerSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    listCareers()
      .then(setCareers)
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  async function openCareer(id: string) {
    await setActiveCareer(id);
    router.push("/home");
  }

  function removeCareer(item: CareerSummary) {
    Alert.alert(
      "커리어 삭제",
      `${item.name}의 커리어를 삭제할까요?\n삭제한 진행도는 복구할 수 없습니다.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            await deleteCareer(item.id);
            refresh();
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>PRO CAREER</Text>
          <Text style={styles.title}>커리어 선택</Text>
          <Text style={styles.sub}>
            기존 선수를 이어하거나 새로운 선수를 시작하세요.
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {!loading && careers.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                아직 생성된 선수가 없습니다.
              </Text>
              <Text style={styles.emptyBody}>
                첫 선수를 만들어 프로 커리어를 시작하세요.
              </Text>
            </View>
          )}

          {careers.map((item) => (
            <Pressable
              key={item.id}
              style={styles.card}
              onPress={() => openCareer(item.id)}
            >
              <View style={styles.avatarBox}>
                <Avatar
                  avatar={item.avatar}
                  size={86}
                  backgroundColor="transparent"
                  borderRadius={0}
                />
              </View>
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.name}</Text>
                  <View style={styles.position}>
                    <Text style={styles.positionText}>{item.position}</Text>
                  </View>
                </View>
                <Text style={styles.stage}>{stageLabel(item.careerStage)}</Text>
                <Text style={styles.date}>게임 날짜 · {item.date}</Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.continue}>이어하기 ›</Text>
                <Pressable
                  hitSlop={10}
                  onPress={(e) => {
                    e.stopPropagation();
                    removeCareer(item);
                  }}
                >
                  <Text style={styles.delete}>삭제</Text>
                </Pressable>
              </View>
            </Pressable>
          ))}

          <Pressable
            style={styles.newCard}
            onPress={() => router.push("/create")}
          >
            <Text style={styles.plus}>＋</Text>
            <View>
              <Text style={styles.newTitle}>새 선수 만들기</Text>
              <Text style={styles.newSub}>새로운 평행세계의 커리어 시작</Text>
            </View>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const LIME = "#B7FF2A";
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#050708" },
  screen: { flex: 1, paddingHorizontal: 18 },
  header: { paddingTop: 28, paddingBottom: 18 },
  eyebrow: { color: LIME, fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  title: { color: "#FFF", fontSize: 32, fontWeight: "900", marginTop: 5 },
  sub: { color: "#7F8993", fontSize: 13, fontWeight: "700", marginTop: 7 },
  list: { paddingBottom: 28, gap: 10 },
  card: {
    minHeight: 118,
    borderRadius: 20,
    backgroundColor: "#10161B",
    borderWidth: 1,
    borderColor: "#29323A",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarBox: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: "#1A2127",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, marginLeft: 14 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { color: "#FFF", fontSize: 22, fontWeight: "900" },
  position: {
    backgroundColor: "#168CFF",
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  positionText: { color: "#FFF", fontSize: 10, fontWeight: "900" },
  stage: { color: LIME, fontSize: 14, fontWeight: "900", marginTop: 8 },
  date: { color: "#77818B", fontSize: 11, fontWeight: "700", marginTop: 5 },
  right: {
    height: 86,
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  continue: { color: "#E7ECF0", fontSize: 12, fontWeight: "900" },
  delete: { color: "#A85E5E", fontSize: 11, fontWeight: "800" },
  newCard: {
    height: 92,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#53606A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  plus: { color: LIME, fontSize: 34, fontWeight: "500" },
  newTitle: { color: "#FFF", fontSize: 16, fontWeight: "900" },
  newSub: { color: "#75808A", fontSize: 11, fontWeight: "700", marginTop: 3 },
  empty: { paddingVertical: 36, alignItems: "center" },
  emptyTitle: { color: "#FFF", fontSize: 17, fontWeight: "900" },
  emptyBody: {
    color: "#75808A",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
});
