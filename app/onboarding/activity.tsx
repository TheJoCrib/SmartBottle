import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../../stores/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors, spacing, typography } from "../../constants/theme";

const ACTIVITY_LEVELS = [
  {
    value: "sedentary",
    label: "Stillasittande",
    description: "Lite eller ingen träning",
    iconName: "sofa-outline" as const,
  },
  {
    value: "light",
    label: "Lätt",
    description: "Träning 1\u20133 dagar/vecka",
    iconName: "walk" as const,
  },
  {
    value: "moderate",
    label: "Måttlig",
    description: "Träning 3\u20135 dagar/vecka",
    iconName: "run" as const,
  },
  {
    value: "active",
    label: "Aktiv",
    description: "Träning 6\u20137 dagar/vecka",
    iconName: "run-fast" as const,
  },
  {
    value: "very_active",
    label: "Mycket aktiv",
    description: "Hård träning dagligen",
    iconName: "weight-lifter" as const,
  },
];

export default function ActivityOnboarding() {
  const insets = useSafeAreaInsets();
  const { token } = useAuthStore();
  const updateProfile = useMutation(api.auth.updateProfile);

  const [activityLevel, setActivityLevel] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivityLevel(value);
  };

  const handleContinue = async () => {
    if (!activityLevel) {
      Alert.alert("Fel", "Välj din aktivitetsnivå");
      return;
    }

    if (!token) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    try {
      await updateProfile({
        token,
        activityLevel: activityLevel as
          | "sedentary"
          | "light"
          | "moderate"
          | "active"
          | "very_active",
      });
      router.push("/onboarding/conditions" as any);
    } catch (error: any) {
      Alert.alert("Fel", error.message || "Kunde inte spara aktivitetsnivå");
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
          <Text style={styles.pageTitle}>Aktivitetsnivå</Text>
          <Text style={styles.pageSubtitle}>
            Hur aktiv är du i vardagen? Det påverkar ditt vätskebehov.
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={styles.section}
        >
          {ACTIVITY_LEVELS.map((level, index) => {
            const isSelected = activityLevel === level.value;
            return (
              <Animated.View
                key={level.value}
                entering={FadeInDown.delay(250 + index * 80).duration(400)}
              >
                <TouchableOpacity
                  style={[
                    styles.activityOption,
                    isSelected && styles.activityOptionSelected,
                  ]}
                  onPress={() => handleSelect(level.value)}
                  activeOpacity={0.7}
                >
                  <View style={styles.activityRow}>
                    <View
                      style={[
                        styles.iconContainer,
                        isSelected && styles.iconContainerSelected,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={level.iconName as any}
                        size={24}
                        color={isSelected ? colors.primary : colors.textMuted}
                      />
                    </View>
                    <View style={styles.activityTextGroup}>
                      <Text
                        style={[
                          styles.activityLabel,
                          isSelected && styles.activityLabelSelected,
                        ]}
                      >
                        {level.label}
                      </Text>
                      <Text style={styles.activityDesc}>
                        {level.description}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(700).duration(500)}
          style={styles.buttonSection}
        >
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Sparar..." : "Fortsätt"}
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
  activityOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: spacing.cardRadius,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  activityOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerSelected: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
  },
  activityTextGroup: {
    marginLeft: 14,
    flex: 1,
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  activityLabelSelected: {
    color: colors.primary,
  },
  activityDesc: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
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
