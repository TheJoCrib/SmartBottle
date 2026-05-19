import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../../stores/authStore";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors, spacing, typography } from "../../constants/theme";

const CONDITIONS = [
  { value: "kidney_issues", label: "Njursjukdom" },
  { value: "heart_condition", label: "Hjärtsjukdom" },
  { value: "pregnancy", label: "Gravid" },
  { value: "diabetes", label: "Diabetes" },
  { value: "high_blood_pressure", label: "Högt blodtryck" },
  { value: "kidney_stones", label: "Njurstenar" },
];

export default function ConditionsStep() {
  const { token } = useAuthStore();
  const updateProfile = useMutation(api.auth.updateProfile);
  const user = useQuery(api.auth.validateSession, token ? { token } : "skip");

  const [selected, setSelected] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.medicalConditions) setSelected(user.medicalConditions);
  }, [user]);

  const toggle = (val: string) => {
    Haptics.selectionAsync();
    setSelected((prev) =>
      prev.includes(val) ? prev.filter((c) => c !== val) : [...prev, val]
    );
  };

  const handleNext = async () => {
    if (!token) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    try {
      await updateProfile({ token, medicalConditions: selected });
      router.push("/onboarding/goal" as any);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.title}>Hälsotillstånd</Text>
          <Text style={styles.subtitle}>Steg 3 av 4 — valfritt</Text>
          <Text style={styles.desc}>
            Välj om något gäller dig. Detta hjälper oss anpassa din rekommendation.
          </Text>
          <View style={styles.disclaimer}>
            <Feather name="alert-circle" size={14} color={colors.warning} />
            <Text style={styles.disclaimerText}>
              Detta ersätter inte medicinsk rådgivning. Rådgör alltid med din läkare om ditt vätskeintag.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.grid}>
          {CONDITIONS.map((item) => {
            const sel = selected.includes(item.value);
            return (
              <TouchableOpacity
                key={item.value}
                style={[styles.chip, sel && styles.chipSel]}
                onPress={() => toggle(item.value)}
                activeOpacity={0.7}
              >
                {sel && <Feather name="check" size={14} color={colors.accent} style={{ marginRight: 6 }} />}
                <Text style={[styles.chipText, sel && { color: colors.accent }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <TouchableOpacity
            style={[styles.nextBtn, isLoading && { opacity: 0.5 }]}
            onPress={handleNext}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>{selected.length === 0 ? "Hoppa över" : "Nästa"}</Text>
            <Feather name="arrow-right" size={20} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.page, paddingTop: 24, paddingBottom: 24 },
  title: { ...typography.header, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 8 },
  desc: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: 28 },
  disclaimer: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: colors.warningMuted, borderRadius: 12, padding: 12, marginBottom: 20 },
  disclaimerText: { flex: 1, fontSize: 12, lineHeight: 17, color: colors.warning },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border },
  chipSel: { borderColor: colors.accent, backgroundColor: colors.primaryMuted },
  chipText: { fontSize: 15, fontWeight: "600", color: colors.textSecondary },
  nextBtn: { flexDirection: "row", backgroundColor: colors.primary, borderRadius: 14, height: 52, alignItems: "center", justifyContent: "center", gap: 8 },
  nextBtnText: { fontSize: 17, fontWeight: "700", color: "#FFF" },
});
