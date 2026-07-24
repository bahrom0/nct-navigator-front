import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette, radius, spacing } from "@/constants/theme";

export function PlaceholderScreen({ title, description }: { title: string; description: string }) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>NCT NAVIGATOR</Text>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.card}>
          <Text style={styles.description}>{description}</Text>
          <Text style={styles.caption}>Экран подключается в следующей профильной сессии.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  content: { flex: 1, padding: spacing.lg, gap: spacing.md },
  eyebrow: { color: palette.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1.4 },
  title: { color: palette.text, fontSize: 30, fontWeight: "800" },
  card: { backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  description: { color: palette.text, fontSize: 17, lineHeight: 25 },
  caption: { color: palette.muted, fontSize: 14, lineHeight: 20 },
});
