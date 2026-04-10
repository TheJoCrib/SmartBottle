import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../../stores/authStore";
import { useHydrationStore } from "../../stores/hydrationStore";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors, spacing, typography } from "../../constants/theme";

export default function GoalOnboarding() {
  const insets = useSafeAreaInsets();
  const { token } = useAuthStore();
  const hydrationStore = useHydrationStore();
  const updateProfile = useMutation(api.auth.updateProfile);

  const [customGoal, setCustomGoal] = useState(false);
  const [manualGoal, setManualGoal] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const user = useQuery(
    api.auth.validateSession,
    token ? { token } : "skip"
  );

  const weight = user?.weight ?? 70;
  const activityLevel = user?.activityLevel ?? "moderate";

  const recommendedIntake = useQuery(
    api.auth.getRecommendedIntake,
    { weight, activityLevel }
  );

  const handleToggleCustom = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCustomGoal(!customGoal);
  };

  const handleStart = async () => {
    if (!token) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    try {
      const profileData: {
        token: string;
        customGoal: boolean;
        dailyGoalMl?: number;
      } = {
        token,
        customGoal,
      };

      if (customGoal && manualGoal) {
        profileData.dailyGoalMl = parseInt(manualGoal);
      } else if (recommendedIntake) {
        profileData.dailyGoalMl = recommendedIntake;
      }

      await updateProfile(profileData);

      const dailyMl = profileData.dailyGoalMl || recommendedIntake || 2500;
      await hydrationStore.setDailyGoal(dailyMl);
      await hydrationStore.setWeeklyGoal(dailyMl * 7);
      await hydrationStore.setMonthlyGoal(dailyMl * 30);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const isEditing = user?.height && user?.weight;
      if (isEditing) {
        router.replace("/(tabs)");
      } else {
        router.push("/onboarding/first-bottle" as any);
      }
    } catch (error: any) {
      Alert.alert("Fel", error.message || "Kunde inte spara ditt mål");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.headerSection}
        >
          <Text style={styles.pageTitle}>Ditt dagsmål</Text>
          <Text style={styles.pageSubtitle}>
            Baserat på din profil har vi beräknat ett rekommenderat vätskeintag.
          </Text>
        </Animated.View>

        {recommendedIntake && (
          <Animated.View
            entering={FadeInDown.delay(250).duration(500)}
            style={styles.section}
          >
            <View style={styles.recommendedCard}>
              <Text style={styles.recommendedLabel}>
                Rekommenderat dagligt intag
              </Text>
              <Text style={styles.recommendedValue}>
                {recommendedIntake}
              </Text>
              <Text style={styles.recommendedUnit}>ml</Text>
              <Text style={styles.recommendedNote}>
                {(recommendedIntake / 1000).toFixed(1)} liter baserat på din vikt och aktivitetsnivå
              </Text>
            </View>
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
          style={styles.section}
        >
          <TouchableOpacity
            style={[
              styles.customGoalToggle,
              customGoal && styles.customGoalToggleActive,
            ]}
            onPress={handleToggleCustom}
            activeOpacity={0.7}
          >
            <View style={styles.customGoalRow}>
              <Ionicons
                name={customGoal ? "checkbox" : "square-outline"}
                size={24}
                color={customGoal ? colors.primary : colors.textMuted}
              />
              <Text style={styles.customGoalText}>Ange eget dagsmål</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {customGoal && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={styles.section}
          >
            <Text style={styles.sectionLabel}>Ditt dagliga mål (ml)</Text>
            <TextInput
              style={[styles.inputCenter, styles.inputBig]}
              placeholder={
                recommendedIntake ? String(recommendedIntake) : "2000"
              }
              placeholderTextColor={colors.inputPlaceholder}
              value={manualGoal}
              onChangeText={setManualGoal}
              keyboardType="number-pad"
              returnKeyType="done"
            />
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInDown.delay(550).duration(500)}
          style={styles.buttonSection}
        >
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleStart}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Sparar..." : (user?.height && user?.weight) ? "Spara" : "Börja"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: spacing.page,
  },
  headerSection: {
    paddingTop: 32,
    paddingBottom: 24,
  },
  pageTitle: {
    fontSize: typography.header.fontSize,
    fontWeight: typography.header.fontWeight,
    letterSpacing: typography.header.letterSpacing,
    color: colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    marginTop: 8,
  },
  section: {
    marginBottom: spacing.sectionGap,
  },
  sectionLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  recommendedCard: {
    backgroundColor: colors.primaryMuted,
    borderRadius: spacing.cardRadius,
    padding: spacing.cardPadding,
    alignItems: "center",
    paddingVertical: 32,
  },
  recommendedLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primaryLight,
    marginBottom: 8,
  },
  recommendedValue: {
    fontSize: 64,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -2,
  },
  recommendedUnit: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.primaryLight,
    marginTop: -4,
  },
  recommendedNote: {
    fontSize: 13,
    color: colors.primaryLight,
    marginTop: 12,
    textAlign: "center",
  },
  customGoalToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: spacing.cardRadius,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  customGoalToggleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  customGoalRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  customGoalText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  inputCenter: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: spacing.cardRadius,
    height: 52,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: "center",
  },
  inputBig: {
    fontSize: 28,
    fontWeight: "700",
    height: 64,
  },
  buttonSection: {
    marginBottom: 32,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: spacing.cardRadius,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
});
