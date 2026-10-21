import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import BottomNav from "../components/BottomNav";

export default function RootLayout() {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="create" />
        </Stack>
      </View>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0B0E10",
  },
  content: {
    flex: 1,
  },
});
