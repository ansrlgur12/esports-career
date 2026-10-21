import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

const LIME = "#C8FF37";

type NavItem = {
  label: string;
  icon: string;
  path: "/" | "/home" | "/player" | "/academy";
  active: (pathname: string) => boolean;
};

const ITEMS: NavItem[] = [
  { label: "홈", icon: "⌂", path: "/home", active: (p) => p === "/home" },
  { label: "OVR", icon: "◎", path: "/player", active: (p) => p === "/player" },
  {
    label: "커리어",
    icon: "▤",
    path: "/academy",
    active: (p) => p === "/academy" || p === "/academy",
  },
  {
    label: "메뉴",
    icon: "≡",
    path: "/",
    active: (p) => p === "/",
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  // 경기/캐릭터 생성처럼 흐름을 중단하면 안 되는 화면에서는 숨긴다.
  if (
    pathname === "/" ||
    pathname === "/match" ||
    pathname === "/create" ||
    pathname === "/prologue"
  )
    return null;

  return (
    <View style={styles.nav}>
      {ITEMS.map((item) => {
        const isActive = item.active(pathname);
        return (
          <Pressable
            key={item.label}
            style={[styles.item, isActive && styles.itemActive]}
            onPress={() => {
              if (pathname !== item.path) router.push(item.path);
            }}
          >
            <Text style={[styles.icon, isActive && styles.active]}>
              {item.icon}
            </Text>
            <Text style={[styles.label, isActive && styles.active]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    height: 68,
    flexDirection: "row",
    backgroundColor: "#0B0E10",
    borderTopWidth: 1,
    borderTopColor: "#222A31",
    paddingHorizontal: 8,
    paddingTop: 7,
    paddingBottom: 5,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  itemActive: { backgroundColor: "#151B12" },
  icon: {
    color: "#69737C",
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 21,
  },
  label: {
    color: "#69737C",
    fontSize: 9,
    fontWeight: "900",
    marginTop: 2,
  },
  active: { color: LIME },
});
