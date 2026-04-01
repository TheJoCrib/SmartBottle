import React, { useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
  FadeIn,
  Easing,
} from "react-native-reanimated";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

import { useHydrationStore } from "../../stores/hydrationStore";
import { useAuthStore } from "../../stores/authStore";
import { useDemoStore } from "../../stores/demoStore";
import { useWeightData } from "../../hooks/useWeightData";
import { BottleSkia } from "../../components/BottleSkia";
import { BottleIcon } from "../../components/BottleIcons";
import { colors, spacing, typography } from "../../constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "God natt";
  if (hour < 12) return "God morgon";
  if (hour < 18) return "God eftermiddag";
  return "God kväll";
}

export default function Home() {
  const { token } = useAuthStore();
  const store = useHydrationStore();
  const demoStore = useDemoStore();
  const weightData = useWeightData();
  const [refreshing, setRefreshing] = React.useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["45%"], []);

  const user = useQuery(api.auth.validateSession, token ? { token } : "skip");
  const bottles = useQuery(api.bottles.list, token ? { token } : "skip");
  const streak = useQuery(api.stats.getStreak, token ? { token } : "skip");

  const waterRemaining = weightData.waterRemainingMl;
  const fillPercentage = weightData.fillPercentage;
  const todayIntake = weightData.todayIntakeMl;
  const dailyProgress = store.dailyGoalMl > 0 ? Math.min(1, todayIntake / store.dailyGoalMl) : 0;
  const userName = user?.name || "";
  const currentStreak = streak?.currentStreak || 0;

  const handleSelectBottle = useCallback(
    async (bottle: any) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (!bottle.fullWeightG || bottle.fullWeightG <= 0) {
        router.push("/bottle/calibrate" as any);
        return;
      }
      await store.setActiveBottle({
        id: bottle._id,
        fullWeightG: bottle.fullWeightG,
        emptyWeightG: bottle.emptyWeightG,
        capacityMl: bottle.fullWeightG - bottle.emptyWeightG,
        modelId: bottle.modelId,
      });
    },
    [store]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const progressWidth = useSharedValue(0);
  useEffect(() => {
    progressWidth.value = withTiming(dailyProgress, {
      duration: 600,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [dailyProgress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  if (!store.isLoaded) {
    return <View style={styles.loading}><StatusBar style="light" /></View>;
  }

  const showBottleSelector = bottles && bottles.length > 1;
  const isDisconnected = weightData.bottleState === "disconnected";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        
        <Animated.View entering={FadeInDown.duration(400).delay(50)} style={styles.header}>
          <Text style={styles.greeting}>
            {getGreeting()}, {userName}
          </Text>
          <View style={styles.statusRow}>
            {!isDisconnected && (
              <View style={styles.bleIndicator}>
                <View style={[styles.bleDot, { backgroundColor: colors.success }]} />
                <Text style={styles.bleLabel}>Ansluten</Text>
              </View>
            )}
            {currentStreak > 0 && (
              <View style={styles.streakBadge}>
                <MaterialCommunityIcons name="fire" size={14} color={colors.warning} />
                <Text style={styles.streakText}>{currentStreak} dagar</Text>
              </View>
            )}
          </View>
        </Animated.View>

        
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Dagens mål</Text>
            <Text style={styles.progressValue}>
              {todayIntake} <Text style={styles.progressDiv}>/</Text> {store.dailyGoalMl} ml
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>
        </Animated.View>

        
        <Animated.View entering={FadeInDown.duration(400).delay(150)}>
          <TouchableOpacity
            style={styles.bottleRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              bottomSheetRef.current?.expand();
            }}
            activeOpacity={0.7}
          >
            <View style={styles.bottleRowLeft}>
              <BottleIcon modelKey="water-bottle" size={18} color={colors.accent} />
              <Text style={styles.bottleRowName}>
                {bottles?.find((b: any) => b._id === store.activeBottleId)?.name || "Välj flaska"}
              </Text>
            </View>
            <Feather name="chevron-down" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        
        <Animated.View entering={FadeIn.duration(600).delay(200)} style={styles.bottleSection}>
          <BottleSkia
            fillPercentage={(store.isCalibrated || store.demoMode) ? fillPercentage : 0}
            currentMl={(store.isCalibrated || store.demoMode) ? waterRemaining : 0}
            bottleState={isDisconnected && !store.demoMode ? "disconnected" : weightData.bottleState}
            modelKey={store.activeBottleModelId}
            width={Math.min(200, SCREEN_WIDTH * 0.5)}
            height={Math.min(SCREEN_HEIGHT * 0.35, 280)}
          />
        </Animated.View>

        
        {isDisconnected && !store.demoMode && (
          <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.connectPrompt}>
            <TouchableOpacity
              style={styles.connectBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/bottle/add");
              }}
              activeOpacity={0.85}
            >
              <Feather name="bluetooth" size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.connectBtnText}>Para din flaska</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        
        {!isDisconnected && !store.isCalibrated && !store.demoMode && (
          <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.connectPrompt}>
            <TouchableOpacity
              style={styles.connectBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/bottle/calibrate");
              }}
              activeOpacity={0.85}
            >
              <Feather name="zap" size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.connectBtnText}>Starta kalibrering</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        
        {(store.isCalibrated || store.demoMode) && (!isDisconnected || store.demoMode) && (
          <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{Math.round(dailyProgress * 100)}%</Text>
              <Text style={styles.summaryLabel}>av mål</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{(todayIntake / 1000).toFixed(1)}L</Text>
              <Text style={styles.summaryLabel}>totalt idag</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{waterRemaining}</Text>
              <Text style={styles.summaryLabel}>i flaskan</Text>
            </View>
          </Animated.View>
        )}

        
        {isDisconnected && !store.demoMode && todayIntake > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{Math.round(dailyProgress * 100)}%</Text>
              <Text style={styles.summaryLabel}>av mål</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{(todayIntake / 1000).toFixed(1)}L</Text>
              <Text style={styles.summaryLabel}>totalt idag</Text>
            </View>
          </Animated.View>
        )}

      </ScrollView>

      
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <BottomSheetView style={styles.sheetContent}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Välj flaska</Text>
            <TouchableOpacity
              onPress={() => {
                bottomSheetRef.current?.close();
                router.push("/bottle/add");
              }}
              style={styles.sheetAddBtn}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={16} color={colors.accent} />
              <Text style={styles.sheetAddText}>Ny flaska</Text>
            </TouchableOpacity>
          </View>

          {bottles && bottles.length > 0 ? (
            bottles.map((bottle: any) => {
              const isActive = bottle._id === store.activeBottleId;
              const isCalibrated = bottle.fullWeightG > 0;
              const cap = isCalibrated ? bottle.fullWeightG - bottle.emptyWeightG : 0;
              return (
                <TouchableOpacity
                  key={bottle._id}
                  style={[styles.sheetItem, isActive && styles.sheetItemActive]}
                  onPress={() => {
                    handleSelectBottle(bottle);
                    bottomSheetRef.current?.close();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.sheetItemIcon, { backgroundColor: (bottle.color || colors.accent) + "20" }]}>
                    <BottleIcon modelKey="water-bottle" size={20} color={bottle.color || colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetItemName}>{bottle.name}</Text>
                    <Text style={styles.sheetItemMeta}>
                      {isCalibrated ? `${cap} ml` : "Ej kalibrerad"}
                    </Text>
                  </View>
                  {isActive && <Feather name="check" size={20} color={colors.accent} />}
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.sheetEmpty}>
              <Text style={styles.sheetEmptyText}>Inga flaskor ännu</Text>
            </View>
          )}
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 30 },
  header: { paddingHorizontal: spacing.page, paddingTop: 8, paddingBottom: 4 },
  greeting: { fontSize: 26, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  bleIndicator: { flexDirection: "row", alignItems: "center", gap: 4 },
  bleDot: { width: 6, height: 6, borderRadius: 3 },
  bleLabel: { fontSize: 12, fontWeight: "500", color: colors.textMuted },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: colors.warningMuted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  streakText: { fontSize: 12, fontWeight: "600", color: colors.warning },
  progressSection: { paddingHorizontal: spacing.page, paddingTop: 16, paddingBottom: 12 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  progressLabel: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  progressValue: { fontSize: 14, fontWeight: "500", color: colors.textSecondary },
  progressDiv: { color: colors.textMuted },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surface, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: colors.accent },
  bottleSection: { alignItems: "center", paddingVertical: 16 },
  summaryCard: { flexDirection: "row", marginHorizontal: spacing.page, marginTop: 12, backgroundColor: colors.surface, borderRadius: spacing.cardRadius, borderWidth: 1, borderColor: colors.border, paddingVertical: 16, paddingHorizontal: 12 },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 20, fontWeight: "800", color: colors.textPrimary },
  summaryLabel: { fontSize: 11, fontWeight: "500", color: colors.textMuted, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: colors.border },
  calibrationPrompt: { alignItems: "center", paddingHorizontal: 40, paddingVertical: 48 },
  calibrationIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  calibrationTitle: { ...typography.title, textAlign: "center", marginBottom: 10 },
  calibrationDesc: { ...typography.body, textAlign: "center", marginBottom: 28 },
  calibrateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 50, minWidth: 200 },
  calibrateBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  statusSection: { alignItems: "center", paddingVertical: 12 },
  statusText: { fontSize: 13, fontWeight: "500", color: colors.textMuted },
  connectPrompt: { alignItems: "center", paddingHorizontal: spacing.page, paddingVertical: 8 },
  connectBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: colors.primary, borderRadius: 14, height: 48, paddingHorizontal: 24, width: "100%" },
  connectBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },

  bottleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: spacing.page,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bottleRowLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  bottleRowName: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },

  sheetBg: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetHandle: { backgroundColor: colors.elevated, width: 40 },
  sheetContent: { paddingHorizontal: 20, paddingBottom: 20 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  sheetAddBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.primaryMuted },
  sheetAddText: { fontSize: 13, fontWeight: "600", color: colors.accent },
  sheetItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  sheetItemActive: { backgroundColor: colors.primaryMuted, marginHorizontal: -20, paddingHorizontal: 20, borderRadius: 12, borderBottomWidth: 0, marginBottom: 2 },
  sheetItemIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  sheetItemName: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  sheetItemMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  sheetEmpty: { alignItems: "center", paddingVertical: 24 },
  sheetEmptyText: { fontSize: 14, color: colors.textMuted },
});
