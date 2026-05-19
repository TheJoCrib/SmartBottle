import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { useKeepAwake } from "expo-keep-awake";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../../stores/authStore";
import { useBottleStore } from "../../stores/bottleStore";
import { useHydrationStore } from "../../stores/hydrationStore";
import { bluetoothService, Device } from "../../services/bluetooth";
import { colors, spacing } from "../../constants/theme";

type CalibrationStep = "connect" | "empty" | "full" | "done";

const STABILITY_DURATION_MS = 2500;

export default function CalibrateBottle() {
  useKeepAwake();

  const { bottleId: routeBottleId, pairOnly } = useLocalSearchParams<{
    bottleId?: string;
    pairOnly?: string;
  }>();

  const { token } = useAuthStore();
  const { currentWeight, isConnected } = useBottleStore();
  const setCalibrating = useBottleStore((s) => s.setCalibrating);
  const hydrationStore = useHydrationStore();
  const updateBottle = useMutation(api.bottles.update);

  const [step, setStep] = useState<CalibrationStep>(
    isConnected && pairOnly !== "1" ? "empty" : "connect",
  );
  const [emptyWeight, setEmptyWeight] = useState<number | null>(null);
  const [fullWeight, setFullWeight] = useState<number | null>(null);
  const [isStable, setIsStable] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTaring, setIsTaring] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [foundDevices, setFoundDevices] = useState<Device[]>([]);
  const [isPairing, setIsPairing] = useState(false);

  const stableTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastWeightRef = useRef<number | null>(null);
  const taredRef = useRef(false);

  useEffect(() => {
    setCalibrating(true);
    return () => setCalibrating(false);
  }, [setCalibrating]);

  const bottles = useQuery(api.bottles.list, token ? { token } : "skip");
  const targetBottle = routeBottleId
    ? bottles?.find((b: any) => b._id === routeBottleId)
    : bottles?.[bottles.length - 1];

  useEffect(() => {
    if (currentWeight === null || step === "done" || step === "connect") {
      setIsStable(false);
      return;
    }

    lastWeightRef.current = currentWeight;

    setIsStable(false);
    if (stableTimerRef.current) clearTimeout(stableTimerRef.current);
    stableTimerRef.current = setTimeout(() => {
      setIsStable(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, STABILITY_DURATION_MS);

    return () => {
      if (stableTimerRef.current) clearTimeout(stableTimerRef.current);
    };
  }, [currentWeight, step]);

  useEffect(() => {
    if (!isConnected || step !== "connect") return;
    if (pairOnly === "1") {
      router.back();
      return;
    }
    setStep("empty");
  }, [isConnected, step, pairOnly]);

  const runTare = async () => {
    setIsTaring(true);
    setIsStable(false);
    lastWeightRef.current = null;
    try {
      await bluetoothService.tare();
    } catch (e) {
      console.warn("Failed to tare scale before calibration:", e);
    } finally {
      setTimeout(() => setIsTaring(false), 800);
    }
  };

  useEffect(() => {
    if (!isConnected) {
      taredRef.current = false;
      return;
    }
    if (step !== "empty") return;
    if (taredRef.current) return;

    taredRef.current = true;
    runTare();
  }, [isConnected, step]);

  const handleRetare = async () => {
    if (!isConnected || isTaring) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await runTare();
  };

  const handleConnect = async () => {
    if (!targetBottle?.bleDeviceId) {
      handleStartScan();
      return;
    }
    setIsConnecting(true);
    try {
      await bluetoothService.connectAndStream(targetBottle.bleDeviceId);
    } catch (error: any) {
      Alert.alert("Anslutningsfel", error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleStartScan = async () => {
    setFoundDevices([]);
    setIsScanning(true);
    try {
      await bluetoothService.scanForDevices((device) => {
        setFoundDevices((prev) => {
          if (prev.find((d) => d.id === device.id)) return prev;
          return [...prev, device];
        });
      }, 10000);
    } catch (error: any) {
      Alert.alert("Sökfel", error.message || "Kunde inte söka efter enheter");
    } finally {
      setIsScanning(false);
    }
  };

  const handleStopScan = () => {
    bluetoothService.stopScan();
    setIsScanning(false);
  };

  const handleSelectDevice = async (device: Device) => {
    if (!token || !targetBottle) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bluetoothService.stopScan();
    setIsScanning(false);
    setIsPairing(true);
    try {
      await updateBottle({
        token,
        bottleId: targetBottle._id as any,
        bleDeviceId: device.id,
      });
      await bluetoothService.connectAndStream(device.id);
    } catch (error: any) {
      Alert.alert("Anslutningsfel", error.message || "Kunde inte ansluta till enheten");
    } finally {
      setIsPairing(false);
    }
  };

  const handleCaptureEmpty = () => {
    if (currentWeight === null) return;
    if (currentWeight < 0) {
      Alert.alert(
        "Ogiltig vikt",
        "Tom vikt är negativ. Tog du bort allt från vågen innan nollställning? Tryck 'Nollställ igen' och försök igen.",
      );
      return;
    }
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
    if (!token || !targetBottle || emptyWeight === null || fullWeight === null) return;
    if (fullWeight <= emptyWeight) {
      Alert.alert(
        "Ogiltig kalibrering",
        "Full vikt måste vara större än tom vikt. Kontrollera att flaskan är fylld och att vågen är stabil.",
      );
      return;
    }
    try {
      await updateBottle({
        token,
        bottleId: targetBottle._id as any,
        emptyWeightG: emptyWeight,
        fullWeightG: fullWeight,
      });
      await hydrationStore.calibrate(fullWeight, emptyWeight);
      await hydrationStore.setActiveBottle({
        id: targetBottle._id,
        fullWeightG: fullWeight,
        emptyWeightG: emptyWeight,
        capacityMl: fullWeight - emptyWeight,
      });
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
              {isScanning ? (
                <ActivityIndicator size="large" color={colors.accent} />
              ) : (
                <Feather name="bluetooth" size={56} color={colors.textMuted} />
              )}
            </View>
            <Text style={styles.stepTitle}>
              {targetBottle?.bleDeviceId
                ? "Anslut din flaska"
                : isScanning
                  ? "Söker efter flaskor..."
                  : isPairing
                    ? "Parar..."
                    : "Hitta din flaska"}
            </Text>
            <Text style={styles.stepDescription}>
              {targetBottle?.bleDeviceId
                ? "Anslut till din SmartBottle via Bluetooth för att starta kalibreringen."
                : isScanning
                  ? "Se till att din SmartBottle är påslagen och i närheten."
                  : "Sök efter din SmartBottle för att para och starta kalibreringen."}
            </Text>

            
            {!targetBottle?.bleDeviceId && foundDevices.length > 0 && (
              <View style={styles.deviceList}>
                {foundDevices.map((device, i) => (
                  <TouchableOpacity
                    key={device.id}
                    style={[
                      styles.deviceRow,
                      i < foundDevices.length - 1 && styles.deviceRowBorder,
                      isPairing && { opacity: 0.5 },
                    ]}
                    onPress={() => handleSelectDevice(device)}
                    disabled={isPairing}
                    activeOpacity={0.7}
                  >
                    <View style={styles.deviceIcon}>
                      <Feather name="bluetooth" size={18} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.deviceName}>{device.name || "SmartBottle"}</Text>
                      <Text style={styles.deviceMeta}>
                        {device.rssi ? `${device.rssi} dBm` : "Okänd signalstyrka"}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (isConnecting || isPairing) && { opacity: 0.5 },
              ]}
              onPress={
                targetBottle?.bleDeviceId
                  ? handleConnect
                  : isScanning
                    ? handleStopScan
                    : handleStartScan
              }
              disabled={isConnecting || isPairing}
              activeOpacity={0.85}
            >
              <Feather
                name={isScanning ? "x" : "bluetooth"}
                size={18}
                color="#FFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.primaryButtonText}>
                {targetBottle?.bleDeviceId
                  ? isConnecting
                    ? "Ansluter..."
                    : "Anslut"
                  : isPairing
                    ? "Parar..."
                    : isScanning
                      ? "Stoppa sökning"
                      : foundDevices.length > 0
                        ? "Sök igen"
                        : "Sök efter flaska"}
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
              {isTaring
                ? "Nollställer vågen — ta bort allt från vågen."
                : "Ställ din tomma flaska på vågen. Vikten låses automatiskt när den är stabil."}
            </Text>

            {currentWeight !== null && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.weightCard}>
                <Text style={styles.weightLabel}>Aktuell vikt</Text>
                <Text style={styles.weightValue}>
                  {isTaring ? "..." : `${Math.round(currentWeight)}g`}
                </Text>
                {isStable && !isTaring && currentWeight >= 0 && (
                  <View style={styles.stableBadge}>
                    <Feather name="check-circle" size={14} color={colors.success} />
                    <Text style={styles.stableText}>Stabil</Text>
                  </View>
                )}
                {!isTaring && currentWeight < -5 && (
                  <View style={styles.warningBadge}>
                    <Feather name="alert-triangle" size={14} color={colors.warning} />
                    <Text style={styles.warningText}>
                      Vågen nollställdes med något på — tryck Nollställ igen
                    </Text>
                  </View>
                )}
              </Animated.View>
            )}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!isStable || currentWeight === null || isTaring || (currentWeight ?? 0) < 0) && {
                  opacity: 0.4,
                },
              ]}
              onPress={handleCaptureEmpty}
              disabled={
                !isStable || currentWeight === null || isTaring || (currentWeight ?? 0) < 0
              }
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Lås tom vikt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, isTaring && { opacity: 0.4 }]}
              onPress={handleRetare}
              disabled={isTaring}
              activeOpacity={0.7}
            >
              <Feather name="refresh-cw" size={15} color={colors.textSecondary} />
              <Text style={styles.secondaryButtonText}>
                {isTaring ? "Nollställer..." : "Nollställ igen"}
              </Text>
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
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    backgroundColor: colors.warningMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    maxWidth: 260,
  },
  warningText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.warning,
    flexShrink: 1,
  },
  deviceList: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: spacing.cardRadius,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    overflow: "hidden",
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  deviceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  deviceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  deviceMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});
