import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { getLeagueDashboard, getScheduleRange } from "../game/engine";
import { loadGame } from "../storage/db";
import type { GameState } from "../types/game";

type Tab = "LEAGUE" | "SCHEDULE" | "KDA" | "LANE";
const LIME = "#C8FF37";
const WEEK = ["월", "화", "수", "목", "금", "토", "일"] as const;

function mondayIndex(weekday: string) {
  const map: Record<string, number> = {
    MON: 0,
    TUE: 1,
    WED: 2,
    THU: 3,
    FRI: 4,
    SAT: 5,
    SUN: 6,
  };
  return map[weekday] ?? 0;
}

export default function RankingsScreen() {
  const [game, setGame] = useState<GameState | null>(null);
  const [tab, setTab] = useState<Tab>("LEAGUE");
  const [weekOffset, setWeekOffset] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      loadGame().then((v) => {
        if (mounted) setGame(v);
      });
      return () => {
        mounted = false;
      };
    }, []),
  );

  const data = useMemo(() => (game ? getLeagueDashboard(game) : null), [game]);
  const schedule = useMemo(
    () => (game ? getScheduleRange(game, 56) : []),
    [game],
  );
  if (!game || !data) return <SafeAreaView style={s.safe} />;

  const league = game.player.careerStage !== "ACADEMY";
  const startPad = schedule.length ? mondayIndex(schedule[0].weekday) : 0;
  const cells = [...Array(startPad).fill(null), ...schedule];
  const weeks = Array.from({ length: Math.ceil(cells.length / 7) }, (_, i) =>
    cells.slice(i * 7, i * 7 + 7),
  );
  const currentWeek = Math.min(
    Math.max(0, weekOffset),
    Math.max(0, weeks.length - 1),
  );
  const shown = weeks[currentWeek] ?? [];
  const shownEntries = shown.filter(Boolean) as typeof schedule;
  const rangeLabel = shownEntries.length
    ? `${shownEntries[0].date.slice(5)} ~ ${shownEntries[shownEntries.length - 1].date.slice(5)}`
    : "";

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.kicker}>VORTEX · LEAGUE CENTER</Text>
        <Text style={s.title}>{league ? "2군 리그" : "아카데미"}</Text>
        <Text style={s.desc}>
          {league
            ? `${game.player.secondTeamSeason.round}R 진행 · ${game.player.secondTeamSeason.wins}승 ${game.player.secondTeamSeason.losses}패`
            : "아카데미는 공식 리그에 참가하지 않습니다. 2군 콜업 후 공식 순위와 KDA가 활성화됩니다."}
        </Text>
      </View>

      <View style={s.tabs}>
        {(
          [
            ["LEAGUE", "순위"],
            ["SCHEDULE", "일정"],
            ["KDA", "KDA"],
            ["LANE", "라인"],
          ] as const
        ).map(([id, label]) => (
          <Pressable
            key={id}
            onPress={() => setTab(id)}
            style={[s.tab, tab === id && s.tabOn]}
          >
            <Text style={[s.tabText, tab === id && s.tabTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.list}>
        {tab === "LEAGUE" &&
          (league ? (
            data.standings.map((row) => (
              <View key={row.team} style={[s.row, row.isMyTeam && s.myRow]}>
                <Text style={[s.rank, row.isMyTeam && s.accent]}>
                  {row.rank}
                </Text>
                <View style={s.main}>
                  <Text style={[s.name, row.isMyTeam && s.accent]}>
                    {row.team}
                  </Text>
                  <Text style={s.sub}>{row.wins + row.losses}경기</Text>
                </View>
                <Text style={s.record}>
                  {row.wins}승 {row.losses}패
                </Text>
                <Text style={s.value}>{Math.round(row.winRate * 100)}%</Text>
              </View>
            ))
          ) : (
            <Empty text="아카데미 단계에는 공식 리그 순위가 없습니다." />
          ))}

        {tab === "SCHEDULE" && (
          <>
            <View style={s.calendarHead}>
              <Pressable
                disabled={currentWeek === 0}
                onPress={() => setWeekOffset((v) => Math.max(0, v - 1))}
                style={[s.arrow, currentWeek === 0 && s.arrowDisabled]}
              >
                <Text style={s.arrowText}>‹</Text>
              </Pressable>
              <View style={s.calendarTitleBox}>
                <Text style={s.calendarTitle}>{rangeLabel}</Text>
                <Text style={s.calendarSub}>주간 일정</Text>
              </View>
              <Pressable
                disabled={currentWeek >= weeks.length - 1}
                onPress={() =>
                  setWeekOffset((v) => Math.min(weeks.length - 1, v + 1))
                }
                style={[
                  s.arrow,
                  currentWeek >= weeks.length - 1 && s.arrowDisabled,
                ]}
              >
                <Text style={s.arrowText}>›</Text>
              </Pressable>
            </View>

            <View style={s.weekHeader}>
              {WEEK.map((day) => (
                <Text key={day} style={s.weekHeaderText}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={s.calendarGrid}>
              {Array.from({ length: 7 }, (_, i) => {
                const row = shown[i] ?? null;
                const isToday = row?.date === game.date;
                const kind = row?.kind;
                const tag =
                  kind === "REGULAR_MATCH"
                    ? "경기"
                    : kind === "PLAYOFF_MATCH"
                      ? "PO"
                      : kind === "SCRIM"
                        ? "스크림"
                        : kind === "REST"
                          ? "휴식"
                          : kind === "EVALUATION"
                            ? "평가"
                            : "훈련";
                return (
                  <View key={i} style={[s.dayCell, isToday && s.todayCell]}>
                    {row ? (
                      <>
                        <Text style={[s.dayNum, isToday && s.accent]}>
                          {Number(row.date.slice(8, 10))}
                        </Text>
                        <View
                          style={[
                            s.scheduleTag,
                            (kind === "REGULAR_MATCH" ||
                              kind === "PLAYOFF_MATCH") &&
                              s.matchTag,
                            kind === "SCRIM" && s.scrimTag,
                            kind === "REST" && s.restTag,
                          ]}
                        >
                          <Text numberOfLines={1} style={s.scheduleTagText}>
                            {tag}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <Text style={s.blank}> </Text>
                    )}
                  </View>
                );
              })}
            </View>

            <View style={s.weekDetails}>
              {shownEntries.map((row) => (
                <View
                  key={row.date}
                  style={[s.detailRow, row.date === game.date && s.myRow]}
                >
                  <View style={s.detailDate}>
                    <Text
                      style={[s.detailDay, row.date === game.date && s.accent]}
                    >
                      {row.date.slice(5)}
                    </Text>
                    <Text style={s.detailWeek}>
                      {WEEK[mondayIndex(row.weekday)]}
                    </Text>
                  </View>
                  <View style={s.main}>
                    <Text style={[s.name, row.date === game.date && s.accent]}>
                      {row.title}
                    </Text>
                    <Text style={s.sub}>
                      {row.split} · {row.phase}
                      {row.opponent ? ` · vs ${row.opponent}` : ""}
                      {row.bestOf ? ` · BO${row.bestOf}` : ""}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {tab === "KDA" &&
          (league ? (
            data.kda.map((row) => (
              <View
                key={`${row.team}-${row.name}`}
                style={[s.row, row.isPlayer && s.myRow]}
              >
                <Text style={[s.rank, row.isPlayer && s.accent]}>
                  {row.rank}
                </Text>
                <View style={s.main}>
                  <Text style={[s.name, row.isPlayer && s.accent]}>
                    {row.name}
                  </Text>
                  <Text style={s.sub}>
                    {row.team} · {row.position} · {row.games}G
                  </Text>
                </View>
                <Text style={s.record}>
                  {row.kills}/{row.deaths}/{row.assists}
                </Text>
                <Text style={s.value}>{row.kda.toFixed(2)}</Text>
              </View>
            ))
          ) : (
            <Empty text="2군 공식전 출전 기록이 생기면 KDA 순위가 집계됩니다." />
          ))}

        {tab === "LANE" &&
          data.lane.map((row) => (
            <View
              key={`${row.team}-${row.name}`}
              style={[s.row, row.isPlayer && s.myRow]}
            >
              <Text style={[s.rank, row.isPlayer && s.accent]}>{row.rank}</Text>
              <View style={s.main}>
                <Text style={[s.name, row.isPlayer && s.accent]}>
                  {row.name}
                </Text>
                <Text style={s.sub}>
                  {row.team} · {row.position}
                </Text>
              </View>
              <Text style={s.scoreLabel}>라인 지표</Text>
              <Text style={s.value}>{row.score}</Text>
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0C1014" },
  header: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14 },
  kicker: { color: LIME, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  title: { color: "#FFF", fontSize: 27, fontWeight: "900", marginTop: 5 },
  desc: {
    color: "#8D98A2",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 7,
  },
  tabs: {
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  tab: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: "#151A1F",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#242C33",
  },
  tabOn: { backgroundColor: "#202A17", borderColor: "#4D6721" },
  tabText: { color: "#7E8992", fontSize: 11, fontWeight: "900" },
  tabTextOn: { color: LIME },
  list: { paddingHorizontal: 18, paddingBottom: 28, gap: 7 },
  row: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#12171B",
    borderWidth: 1,
    borderColor: "#222A30",
  },
  myRow: { backgroundColor: "#182012", borderColor: "#4B6421" },
  rank: { width: 28, color: "#77818A", fontSize: 16, fontWeight: "900" },
  main: { flex: 1, minWidth: 0 },
  name: { color: "#F5F7F8", fontSize: 14, fontWeight: "900" },
  sub: { color: "#727D86", fontSize: 10, fontWeight: "700", marginTop: 3 },
  record: {
    color: "#B7C0C7",
    fontSize: 11,
    fontWeight: "800",
    marginRight: 10,
  },
  value: {
    width: 42,
    textAlign: "right",
    color: "#FFF",
    fontSize: 14,
    fontWeight: "900",
  },
  scoreLabel: {
    color: "#737E87",
    fontSize: 9,
    fontWeight: "800",
    marginRight: 8,
  },
  accent: { color: LIME },
  empty: {
    padding: 24,
    borderRadius: 14,
    backgroundColor: "#12171B",
    borderWidth: 1,
    borderColor: "#222A30",
  },
  emptyText: {
    color: "#87929B",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
  },

  calendarHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  calendarTitleBox: { alignItems: "center" },
  calendarTitle: { color: "#FFF", fontSize: 16, fontWeight: "900" },
  calendarSub: {
    color: "#707B84",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
  },
  arrow: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#171D22",
    borderWidth: 1,
    borderColor: "#293139",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowDisabled: { opacity: 0.28 },
  arrowText: { color: "#FFF", fontSize: 27, fontWeight: "700", lineHeight: 29 },
  weekHeader: { flexDirection: "row", marginTop: 3 },
  weekHeaderText: {
    flex: 1,
    textAlign: "center",
    color: "#68737C",
    fontSize: 10,
    fontWeight: "900",
  },
  calendarGrid: { flexDirection: "row", gap: 4, marginTop: 6 },
  dayCell: {
    flex: 1,
    minWidth: 0,
    minHeight: 76,
    borderRadius: 10,
    backgroundColor: "#12171B",
    borderWidth: 1,
    borderColor: "#222A30",
    paddingVertical: 7,
    paddingHorizontal: 3,
    alignItems: "center",
  },
  todayCell: { backgroundColor: "#182012", borderColor: "#66882A" },
  dayNum: { color: "#D9DEE2", fontSize: 13, fontWeight: "900" },
  blank: { color: "transparent" },
  scheduleTag: {
    width: "100%",
    marginTop: 8,
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 2,
    backgroundColor: "#22292F",
  },
  matchTag: { backgroundColor: "#31351A" },
  scrimTag: { backgroundColor: "#1D2930" },
  restTag: { backgroundColor: "#242424" },
  scheduleTagText: {
    textAlign: "center",
    color: "#DDE3E7",
    fontSize: 8,
    fontWeight: "900",
  },
  weekDetails: { gap: 6, marginTop: 10 },
  detailRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    borderRadius: 12,
    backgroundColor: "#12171B",
    borderWidth: 1,
    borderColor: "#222A30",
  },
  detailDate: { width: 52 },
  detailDay: { color: "#E9EDF0", fontSize: 12, fontWeight: "900" },
  detailWeek: {
    color: "#66717A",
    fontSize: 9,
    fontWeight: "800",
    marginTop: 2,
  },
});
