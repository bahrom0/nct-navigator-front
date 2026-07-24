import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "@/api/client";
import { getSystemStatus, type SystemStatus } from "@/api/system-status";
import { mobileConfig } from "@/config/environment";
import { palette, radius, spacing } from "@/constants/theme";

type ScreenState = { kind: "loading" } | { kind: "ready"; status: SystemStatus } | { kind: "error"; message: string; maintenance?: boolean };

export default function HomeScreen() {
  const [state, setState] = useState<ScreenState>({ kind: "loading" });

  const fetchState = useCallback(async (signal?: AbortSignal): Promise<ScreenState | null> => {
    try {
      const status = await getSystemStatus(signal);
      return status.enabled ? { kind: "ready", status } : { kind: "error", message: status.message, maintenance: true };
    } catch (error) {
      if (signal?.aborted) return null;
      const apiError = error instanceof ApiError ? error : undefined;
      return { kind: "error", message: apiError?.message ?? "Не удалось проверить сервер.", maintenance: apiError?.kind === "maintenance" };
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchState(controller.signal).then((nextState) => {
      if (nextState) setState(nextState);
    });
    return () => controller.abort();
  }, [fetchState]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>NCT NAVIGATOR · MOBILE</Text>
        <Text style={styles.title}>Путь к профессии — в одном приложении</Text>
        <Text style={styles.subtitle}>Нативный клиент использует тот же backend-контракт, но имеет собственную мобильную навигацию и жизненный цикл.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Состояние сервиса</Text>
          {state.kind === "loading" && <View style={styles.row}><ActivityIndicator color={palette.primary} /><Text style={styles.muted}>Проверяем API…</Text></View>}
          {state.kind === "ready" && <><Text style={styles.success}>● Сервис доступен</Text><Text style={styles.muted}>Окружение: {mobileConfig.ok ? mobileConfig.value.appEnvironment : "не настроено"}</Text></>}
          {state.kind === "error" && <><Text style={state.maintenance ? styles.warning : styles.error}>{state.maintenance ? "Технические работы" : "Нет соединения"}</Text><Text style={styles.muted}>{state.message}</Text><Pressable accessibilityRole="button" onPress={() => { setState({ kind: "loading" }); void fetchState().then((nextState) => { if (nextState) setState(nextState); }); }} style={styles.button}><Text style={styles.buttonText}>Повторить</Text></Pressable></>}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Фундамент Session 01</Text>
          <Text style={styles.item}>✓ Изолированный Expo development build</Text>
          <Text style={styles.item}>✓ Типизированный API и отмена запросов</Text>
          <Text style={styles.item}>✓ Maintenance и ошибочная конфигурация</Text>
          <Text style={styles.item}>✓ Пять нативных разделов приложения</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  eyebrow: { color: palette.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: palette.text, fontSize: 31, lineHeight: 38, fontWeight: "800" },
  subtitle: { color: palette.muted, fontSize: 16, lineHeight: 24 },
  card: { backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  cardTitle: { color: palette.text, fontSize: 19, fontWeight: "800" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  muted: { color: palette.muted, fontSize: 15, lineHeight: 22 },
  success: { color: palette.success, fontSize: 16, fontWeight: "700" },
  warning: { color: palette.warning, fontSize: 18, fontWeight: "800" },
  error: { color: palette.danger, fontSize: 18, fontWeight: "800" },
  item: { color: palette.text, fontSize: 15, lineHeight: 23 },
  button: { alignSelf: "flex-start", marginTop: spacing.sm, backgroundColor: palette.primary, borderRadius: radius.md, paddingVertical: 11, paddingHorizontal: spacing.md },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
