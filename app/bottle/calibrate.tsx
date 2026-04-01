import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { useKeepAwake } from "expo-keep-awake";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Feather, Ionicons } from "@expo/vector-icons";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../../stores/authStore";
import { useBottleStore } from "../../stores/bottleStore";
import { useHydrationStore } from "../../stores/hydrationStore";
import { bluetoothService } from "../../services/bluetooth";
import { colors, spacing } from "../../constants/theme";

type CalibrationStep = "connect" | "empty" | "full" | "done";

const STABILITY_DURATION_MS = 2500;
const STABILITY_THRESHOLD_G = 2;

export default function CalibrateBottle() {
  useKeepAwake();

  const { token } = useAuthStore();
  const { currentWeight, isConnected } = useBottleStore();
  const hydrationStore = useHydrationStore();
  const updateBottle = useMutation(api.bottles.update);

  const [step, setStep] = useState<CalibrationStep>(isConnected ? "empty" : "connect");
  const [emptyWeight, setEmptyWeight] = useState<number | null>(null);
  const [fullWeight, setFullWeight] = useState<number | null>(null);
  const [isStable, setIsStable] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const stableTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastWeightRef = useRef<number | null>(null);

  const bottles = useQuery(api.bottles.list, token ? { token } : "skip");
  const latestBottle = bottles?.[bottles.length - 1];

  useEffect(() => {
    if (currentWeight === null || step === "done" || step === "connect") {
      setIsStable(false);
      return;
    }

    const diff = Math.abs((currentWeight ?? 0) - (lastWeightRef.current ?? 0));
    lastWeightRef.current = currentWeight;

    if (diff > STABILITY_THRESHOLD_G) {
      setIsStable(false);
      if (stableTimerRef.current) clearTimeout(stableTimerRef.current);
      stableTimerRef.current = setTimeout(() => {
        setIsStable(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, STABILITY_DURATION_MS);
    }

    return () => {
      if (stableTimerRef.current) clearTimeout(stableTimerRef.current);
    };
  }, [currentWeight, step]);

  useEffect(() => {
    if (isConnected && step === "connect") setStep("empty");
  }, [isConnected]);

  const handleConnect = async () => {
    if (!latestBottle?.bleDeviceId) {
      Alert.alert("Fel", "Ingen Bluetooth-enhet kopplad till denna flaska");
      return;
    }
    setIsConnecting(true);
    try {
      await bluetoothService.connect(latestBottle.bleDeviceId);
      await bluetoothService.subscribeToWeight(() => {});
    } catch (error: any) {
      Alert.alert("Anslutningsfel", error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCaptureEmpty = () => {
    if (currentWeight === null) return;
    setEmptyWeight(currentWeight);
    setIsStable(false);
    lastWeightRef.current = null;
    setStep("full");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleCaptureFull = () => {
    if (currentWeight === null) return;
    setFullWeight(currentWeight);
    setStep("done");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSave = async () => {
    if (!token || !latestBottle || emptyWeight === null || fullWeight === null) return;
    try {
      await updateBottle({
        token,
        bottleId: latestBottle._id as any,
        emptyWeightG: emptyWeight,
        fullWeightG: fullWeight,
      });
      await hydrationStore.calibrate(fullWeight, emptyWeight);
      if (latestBottle) {
        await hydrationStore.setActiveBottle({
          id: latestBottle._id,
          fullWeightG: fullWeight,
          emptyWeightG: emptyWeight,
          capacityMl: fullWeight - emptyWeight,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Fel", error.message || "Kunde inte spara kalibrering");
    }
  };

  const waterWeight = (fullWeight ?? 0) - (emptyWeight ?? 0);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.content}>
        {step === "connect" && (
          <Animated.View entering={FadeIn.duration(500)} style={styles.center}>
            <View style={styles.iconCircleLarge}>
              <Feather name="bluetooth" size={56} color={colors.textMuted} />
            </View>
            <Text style={styles.stepTitle}>Anslut din flaska</Text>
            <Text style={styles.stepDescription}>
              Anslut till din SmartBottle via Bluetooth för att starta kalibreringen.
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, isConnecting && { opacity: 0.5 }]}
              onPress={handleConnect}
              disabled={isConnecting}
              activeOpacity={0.85}
            >
              <Feather name="bluetooth" size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>
                {isConnecting ? "Ansluter..." : "Anslut"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {step === "empty" && (
          <Animated.View entering={FadeInDown.duration(500)} style={styles.center}>
            <View style={[styles.iconCircleLarge, { backgroundColor: colors.primaryMuted }]}>
              <MaterialCommunityIcons name="scale-balance" size={56} color={colors.primary} />
            </View>
            <Text style={styles.stepTitle}>Tom flaska</Text>
            <Text style={styles.stepDescription}>
              Ställ din tomma flaska på vågen. Vikten låses automatiskt när den är stabil.
            </Text>

            {currentWeight !== null && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.weightCard}>
                <Text style={styles.weightLabel}>Aktuell vikt</Text>
                <Text style={styles.weightValue}>{Math.round(currentWeight)}g</Text>
                {isStable && (
                  <View style={styles.stableBadge}>
                    <Feather name="check-circle" size={14} color={colors.success} />
                    <Text style={styles.stableText}>Stabil</Text>
                  </View>
                )}
              </Animated.View>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, (!isStable || currentWeight === null) && { opacity: 0.4 }]}
              onPress={handleCaptureEmpty}
              disabled={!isStable || currentWeight === null}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Lås tom vikt</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {step === "full" && (
          <Animated.View entering={FadeInDown.duration(500)} style={styles.center}>
            <View style={[styles.iconCircleLarge, { backgroundColor: colors.primaryMuted }]}>
              <Ionicons name="water" size={56} color={colors.primary} />
            </View>
            <Text style={styles.stepTitle}>Full flaska</Text>
            <Text style={styles.stepDescription}>
              Fyll flaskan helt och ställ den på vågen.
            </Text>

            <View style={styles.capturedBadge}>
              <Feather name="check-circle" size={16} color={colors.success} />
              <Text style={styles.capturedText}>Tom vikt: {emptyWeight}g</Text>
            </View>

            {currentWeight !== null && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.weightCard}>
                <Text style={styles.weightLabel}>Aktuell vikt</Text>
                <Text style={styles.weightValue}>{Math.round(currentWeight)}g</Text>
                {isStable && (
                  <View style={styles.stableBadge}>
                    <Feather name="check-circle" size={14} color={colors.success} />
                    <Text style={styles.stableText}>Stabil</Text>
                  </View>
                )}
              </Animated.View>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, (!isStable || currentWeight === null) && { opacity: 0.4 }]}
              onPress={handleCaptureFull}
              disabled={!isStable || currentWeight === null}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Lås full vikt</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {step === "done" && (
          <Animated.View entering={FadeIn.duration(600)} style={styles.center}>
            <View style={[styles.iconCircleLarge, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
              <Feather name="check-circle" size={56} color={colors.success} />
            </View>
            <Text style={styles.stepTitle}>Kalibrering klar!</Text>
            <Text style={styles.stepDescription}>
              Din flaska är nu kalibrerad och redo att användas.
            </Text>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tom vikt</Text>
                <Text style={styles.summaryValue}>{emptyWeight}g</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryRowBorder]}>
                <Text style={styles.summaryLabel}>Full vikt</Text>
                <Text style={styles.summaryValue}>{fullWeight}g</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Vattenkapacitet</Text>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>~{waterWeight}ml</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Spara och börja spåra</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

import { MaterialCommunityIcons } from "@expo/vector-icons";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navBar: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },
  dismissHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.elevated,
    marginBottom: 12,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: spacing.page,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.page,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(148, 163, 184, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  weightCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.cardRadius,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    width: "100%",
  },
  weightLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 4,
  },
  weightValue: {
    fontSize: 48,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -2,
  },
  stableBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stableText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.success,
  },
  capturedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  capturedText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.success,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.cardRadius,
    padding: 16,
    width: "100%",
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  summaryRowBorder: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 200,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
