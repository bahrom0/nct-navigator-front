import { Stack, type ErrorBoundaryProps } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { palette, radius, spacing } from "@/constants/theme";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaProvider>
      <View style={styles.errorRoot}>
        <Text style={styles.errorTitle}>Приложение не смогло открыть экран</Text>
        <Text style={styles.errorMessage}>{error.message}</Text>
        <Pressable accessibilityRole="button" onPress={retry} style={styles.retryButton}>
          <Text style={styles.retryText}>Попробовать снова</Text>
        </Pressable>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  errorRoot: { flex: 1, justifyContent: "center", backgroundColor: palette.background, padding: spacing.lg, gap: spacing.md },
  errorTitle: { color: palette.text, fontSize: 24, lineHeight: 31, fontWeight: "800" },
  errorMessage: { color: palette.muted, fontSize: 15, lineHeight: 22 },
  retryButton: { alignSelf: "flex-start", backgroundColor: palette.primary, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: spacing.md },
  retryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
