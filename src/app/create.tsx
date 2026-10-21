import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import Avatar from "../components/Avatar";
import { defaultAvatar, newGame, positions } from "../game/engine";
import { createCareer } from "../storage/db";
import { AvatarState, Position } from "../types/game";

const COUNTS: Record<keyof AvatarState, number> = {
  face: 3,
  eyes: 3,
  noseMouth: 3,
  hair: 4,
  accessory: 3,
};

const LABELS: Record<keyof AvatarState, string> = {
  face: "얼굴형",
  eyes: "눈",
  noseMouth: "코·입",
  hair: "헤어스타일",
  accessory: "악세사리",
};

function Selector({
  label,
  value,
  count,
  onChange,
}: {
  label: string;
  value: number;
  count: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.selector}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <View style={styles.selectorControls}>
        <Pressable
          style={styles.arrow}
          onPress={() => onChange((value - 1 + count) % count)}
        >
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <Text style={styles.countText}>
          {value + 1} / {count}
        </Text>
        <Pressable
          style={styles.arrow}
          onPress={() => onChange((value + 1) % count)}
        >
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function CreateScreen() {
  const [name, setName] = useState("");
  const [position, setPosition] = useState<Position>("MID");
  const [avatar, setAvatar] = useState<AvatarState>({ ...defaultAvatar });
  const [saving, setSaving] = useState(false);

  function changeAvatar(key: keyof AvatarState, value: number) {
    setAvatar((prev) => ({ ...prev, [key]: value }));
  }

  function randomAvatar() {
    setAvatar({
      face: Math.floor(Math.random() * COUNTS.face),
      eyes: Math.floor(Math.random() * COUNTS.eyes),
      noseMouth: Math.floor(Math.random() * COUNTS.noseMouth),
      hair: Math.floor(Math.random() * COUNTS.hair),
      accessory: Math.floor(Math.random() * COUNTS.accessory),
    });
  }

  async function createPlayer() {
    if (saving) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("선수명 확인", "선수명을 입력해주세요.");
      return;
    }

    try {
      setSaving(true);
      const game = newGame(trimmedName, position, avatar);
      await createCareer(game);
      router.replace("/prologue");
    } catch (error) {
      console.error(error);
      Alert.alert("저장 오류", "선수 데이터를 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>NEW CAREER</Text>
            <Text style={styles.title}>신인 선수 생성</Text>
          </View>
        </View>

        <View style={styles.preview}>
          <Avatar
            avatar={avatar}
            size={210}
            backgroundColor="#E8EBEE"
            borderRadius={18}
          />
          <Pressable style={styles.randomButton} onPress={randomAvatar}>
            <Text style={styles.randomText}>랜덤 외형</Text>
          </Pressable>
        </View>

        <TextInput
          value={name}
          onChangeText={setName}
          maxLength={14}
          autoCapitalize="characters"
          placeholder="닉네임"
          placeholderTextColor="#66717D"
          style={styles.nameInput}
        />

        <View style={styles.positions}>
          {positions.map((p) => (
            <Pressable
              key={p}
              style={[
                styles.positionButton,
                position === p && styles.positionButtonActive,
              ]}
              onPress={() => setPosition(p)}
            >
              <Text
                style={[
                  styles.positionText,
                  position === p && styles.positionTextActive,
                ]}
              >
                {p}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.customPanel}>
          {(Object.keys(COUNTS) as (keyof AvatarState)[]).map((key) => (
            <Selector
              key={key}
              label={LABELS[key]}
              value={avatar[key]}
              count={COUNTS[key]}
              onChange={(value) => changeAvatar(key, value)}
            />
          ))}
        </View>

        <Pressable
          style={[styles.createButton, saving && { opacity: 0.6 }]}
          onPress={createPlayer}
          disabled={saving}
        >
          <Text style={styles.createText}>
            {saving ? "생성 중..." : "선수 생성하기"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },

  // 기존 82px 헤더를 줄여 상단 공간 절약
  header: {
    height: 56,
    justifyContent: "center",
  },
  eyebrow: {
    color: "#8D98A6",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  title: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 1,
  },

  // 정방형 유지: Avatar 210 x 210 + 컨테이너 220 높이
  preview: {
    height: 220,
    borderRadius: 20,
    backgroundColor: "#10151A",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  randomButton: {
    position: "absolute",
    right: 10,
    bottom: 9,
    backgroundColor: "rgba(0,0,0,.72)",
    borderWidth: 1,
    borderColor: "#52606D",
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  randomText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 10,
  },

  nameInput: {
    height: 44,
    marginTop: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#344250",
    backgroundColor: "#0F161C",
    color: "#FFF",
    paddingHorizontal: 14,
    fontSize: 17,
    fontWeight: "900",
  },

  positions: {
    flexDirection: "row",
    gap: 5,
    marginTop: 6,
  },
  positionButton: {
    flex: 1,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#344250",
  },
  positionButtonActive: {
    backgroundColor: "#168CFF",
    borderColor: "#168CFF",
  },
  positionText: {
    color: "#9CA6B1",
    fontSize: 10,
    fontWeight: "900",
  },
  positionTextActive: {
    color: "#FFF",
  },

  // 5개 외형 선택 행을 35px 단위로 압축
  customPanel: {
    flex: 1,
    minHeight: 181,
    marginTop: 7,
    borderRadius: 15,
    backgroundColor: "#0D1216",
    paddingHorizontal: 10,
    paddingVertical: 3,
    justifyContent: "space-evenly",
  },
  selector: {
    minHeight: 35,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  selectorLabel: {
    color: "#E8EBEF",
    fontSize: 12,
    fontWeight: "800",
  },
  selectorControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  arrow: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#1A222A",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    color: LIME,
    fontSize: 23,
    fontWeight: "700",
    lineHeight: 25,
  },
  countText: {
    width: 42,
    color: "#C4CBD3",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
  },

  createButton: {
    height: 50,
    marginTop: 7,
    borderRadius: 14,
    backgroundColor: LIME,
    alignItems: "center",
    justifyContent: "center",
  },
  createText: {
    color: "#081000",
    fontSize: 16,
    fontWeight: "900",
  },
});
