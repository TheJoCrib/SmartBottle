import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Easing } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInDown,
} from "react-native-reanimated";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";

import { useHydrationStore } from "../../stores/hydrationStore";
import { WaterBottleCapsule } from "../../components/WaterBottleCapsule";
import { CalibrationModal } from "../../components/CalibrationModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function Home() {
  const store = useHydrationStore();
  const [showCalibration, setShowCalibration] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);

  useEffect(() => {
    if (store.isCalibrated && store.simulatedWeightG !== null) {
      setSliderValue(store.simulatedWeightG);
    }
  }, [store.isCalibrated, store.simulatedWeightG]);

  const handleCalibrate = useCallback(
    async (fullWeight: number, emptyWeight: number) => {
      await store.calibrate(fullWeight, emptyWeight);
      setSliderValue(fullWeight);
      setShowCalibration(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [store]
  );

  const handleSliderChange = useCallback((value: number) => {
    setSliderValue(value);
  }, []);

  const handleSliderComplete = useCallback(
    (value: number) => {
      store.setSimulatedWeight(Math.round(value));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [store]
  );

  const handleRefill = useCallback(() => {
    store.refillBottle();
    setSliderValue(store.fullWeightG);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [store]);

  const handleRecalibrate = useCallback(() => {
    setShowCalibration(true);
  }, []);

  const progressPercent =
    store.dailyGoalMl > 0
      ? Math.min(1, store.todayIntakeMl / store.dailyGoalMl)
      : 0;

  const waterRemaining = store.getWaterRemainingMl();
  const bottleCapacity = store.getBottleCapacityMl();
  const statusText = store.getStatusText();

  const progressBarWidth = useSharedValue(0);
  useEffect(() => {
    progressBarWidth.value = withTiming(progressPercent, {
      duration: 600,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [progressPercent]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressBarWidth.value * 100}%`,
  }));

  if (!store.isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />

      
      <Animated.View
        entering={FadeInDown.duration(500).delay(100)}
        style={styles.header}
      >
        <View>
          <Text style={styles.appTitle}>V\u00e4tskebalans</Text>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(tabs)/settings");
          }}
          hitSlop={12}
        >
          <Feather name="settings" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </Animated.View>

      
      <Animated.View
        entering={FadeInDown.duration(500).delay(200)}
        style={styles.progressSection}
      >
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Dagens m\u00e5l</Text>
          <Text style={styles.progressValue}>
            {store.todayIntakeMl}{" "}
            <Text style={styles.progressDivider}>/</Text>{" "}
            {store.dailyGoalMl} ml
          </Text>
        </View>
        <View style={styles.progressBarTrack}>
          <Animated.View style={[styles.progressBarFill, progressBarStyle]} />
        </View>
      </Animated.View>

      
      {!store.isCalibrated ? (
        <Animated.View
          entering={FadeInUp.duration(600).delay(300)}
          style={styles.calibrationPrompt}
        >
          <View style={styles.calibrationIconContainer}>
            <MaterialCommunityIcons
              name="scale-balance"
              size={48}
              color="#3B82F6"
            />
          </View>
          <Text style={styles.calibrationTitle}>Kalibrera din flaska</Text>
          <Text style={styles.calibrationDescription}>
            F\u00f6r att m\u00e4ta r\u00e4tt beh\u00f6ver vi veta vad din flaska v\u00e4ger n\u00e4r den \u00e4r full och n\u00e4r den \u00e4r tom.
          </Text>
          <TouchableOpacity
            style={styles.calibrateButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowCalibration(true);
            }}
            activeOpacity={0.85}
          >
            <Feather
              name="zap"
              size={18}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.calibrateButtonText}>Starta kalibrering</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <View style={styles.calibratedContent}>
          
          <Animated.View
            entering={FadeIn.duration(700).delay(300)}
            style={styles.bottleContainer}
          >
            <WaterBottleCapsule
              currentMl={waterRemaining}
              maxMl={bottleCapacity}
              width={Math.min(190, SCREEN_WIDTH * 0.46)}
              height={Math.min(320, SCREEN_WIDTH * 0.78)}
            />
          </Animated.View>

          
          <Animated.View
            entering={SlideInDown.duration(500).delay(500)}
            style={styles.sensorCard}
          >
            <View style={styles.sensorHeader}>
              <View style={styles.sensorTitleRow}>
                <Ionicons
                  name="radio-outline"
                  size={20}
                  color="#3B82F6"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.sensorTitle}>
                  Sensordata (Simulering)
                </Text>
              </View>
              <TouchableOpacity
                style={styles.refillButton}
                onPress={handleRefill}
                hitSlop={8}
              >
                <Ionicons
                  name="water-outline"
                  size={16}
                  color="#3B82F6"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.refillText}>Fyll p\u00e5</Text>
              </TouchableOpacity>
            </View>

            
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={store.emptyWeightG}
                maximumValue={store.fullWeightG}
                value={sliderValue}
                onValueChange={handleSliderChange}
                onSlidingComplete={handleSliderComplete}
                minimumTrackTintColor="#3B82F6"
                maximumTrackTintColor="#E2E8F0"
                thumbTintColor="#3B82F6"
              />
            </View>

            
            <TouchableOpacity onPress={handleRecalibrate} hitSlop={8}>
              <Text style={styles.recalibrateText}>Kalibrera om</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      
      <CalibrationModal
        visible={showCalibration}
        onClose={() => setShowCalibration(false)}
        onSave={handleCalibrate}
        initialFullWeight={store.isCalibrated ? store.fullWeightG : undefined}
        initialEmptyWeight={store.isCalibrated ? store.emptyWeightG : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0C1425",
  },
  container: {
    flex: 1,
    backgroundColor: "#0C1425",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  statusText: {
    fontSize: 14,
    color: "rgba(148, 163, 184, 0.8)",
    marginTop: 2,
    fontWeight: "400",
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  progressSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  progressValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.7)",
  },
  progressDivider: {
    color: "rgba(255, 255, 255, 0.35)",
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#3B82F6",
  },

  calibrationPrompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  calibrationIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(59, 130, 246, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  calibrationTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
  },
  calibrationDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(148, 163, 184, 0.7)",
    textAlign: "center",
    marginBottom: 32,
  },
  calibrateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 50,
    minWidth: 220,
  },
  calibrateButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  calibratedContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  bottleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  sensorCard: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
  },
  sensorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sensorTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sensorTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  refillButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  refillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3B82F6",
  },
  sliderContainer: {
    marginBottom: 10,
  },
  slider: {
    width: "100%",
    height: 36,
  },
  recalibrateText: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(148, 163, 184, 0.6)",
    textDecorationLine: "underline",
  },
});
