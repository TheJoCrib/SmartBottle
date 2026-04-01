import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../../stores/authStore";
import { useHydrationStore } from "../../stores/hydrationStore";
import { useDemoStore } from "../../stores/demoStore";
import { useWeightData } from "../../hooks/useWeightData";
import { Ionicons, Feather } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors, spacing, typography } from "../../constants/theme";

type TabKey = "idag" | "vecka" | "manad" | "totalt";

const TABS: { key: TabKey; label: string }[] = [
  { key: "idag", label: "Idag" },
  { key: "vecka", label: "Vecka" },
  { key: "manad", label: "Månad" },
  { key: "totalt", label: "Totalt" },
];

const WEEKDAYS = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];
const SW = Dimensions.get("window").width;

function AnimatedBar({ value, maxValue, index, label, goal, selected, onPress }: {
  value: number; maxValue: number; index: number; label: string; goal?: number;
  selected?: boolean; onPress?: () => void;
}) {
  const barHeight = useSharedValue(0);
  const targetH = maxValue > 0 ? Math.max(4, (value / maxValue) * 130) : 4;
  const metGoal = goal ? value >= goal : false;

  useEffect(() => {
    barHeight.value = withDelay(
      index * 60,
      withSpring(targetH, { damping: 14, stiffness: 90, mass: 0.8 })
    );
  }, [targetH, index]);

  const barStyle = useAnimatedStyle(() => ({
    height: barHeight.value,
  }));

  const barColor = selected
    ? colors.textPrimary
    : metGoal ? colors.success : colors.accent;

  return (
    <TouchableOpacity style={s.barCol} onPress={onPress} activeOpacity={0.7}>
      <View style={s.barTrack}>
        
        {selected && value > 0 && (
          <View style={s.barTooltip}>
            <Text style={s.barTooltipText}>{value}</Text>
            <Text style={s.barTooltipUnit}>ml</Text>
          </View>
        )}
        <Animated.View style={[s.bar, barStyle, { backgroundColor: barColor }]} />
      </View>
      <Text style={[s.barLabel, selected && s.barLabelSel]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function Stats() {
  const { token } = useAuthStore();
  const store = useHydrationStore();
  const demoStore = useDemoStore();
  const weightData = useWeightData();
  const [activeTab, setActiveTab] = useState<TabKey>("idag");

  const isDemo = store.demoMode;

  const skip = "skip" as const;
  const todayStats = useQuery(api.stats.getToday, !isDemo && token ? { token } : skip);
  const weeklyStats = useQuery(api.stats.getWeekly, !isDemo && token ? { token } : skip);
  const streakStats = useQuery(api.stats.getStreak, !isDemo && token ? { token } : skip);
  const allTimeStats = useQuery(api.stats.getAllTime, !isDemo && token ? { token } : skip);

  const todayIntake = weightData.todayIntakeMl;
  const dailyGoal = store.dailyGoalMl;
  const dailyPct = dailyGoal > 0 ? Math.min(100, Math.round((todayIntake / dailyGoal) * 100)) : 0;
  const streak = isDemo ? 0 : (streakStats?.currentStreak || 0);

  const demoWeekData = useMemo(() => {
    const dayOfWeek = new Date().getDay();
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    return WEEKDAYS.map((label, i) => ({
      label,
      totalMl: i < adjustedDay
        ? Math.round(dailyGoal * (0.5 + (((i * 7 + 3) % 10) / 10) * 0.7))
        : i === adjustedDay ? todayIntake : 0,
    }));
  }, [dailyGoal, todayIntake]);

  const demoMonthData = useMemo(() => {
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const today = new Date().getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      if (i + 1 > today) return 0;
      if (i + 1 === today) return todayIntake;
      const seed = ((i + 1) * 17 + 7) % 10;
      return Math.round(dailyGoal * (0.4 + seed * 0.08));
    });
  }, [dailyGoal, todayIntake]);

  function IdagTab() {
    const ringProgress = useSharedValue(0);
    useEffect(() => {
      ringProgress.value = withSpring(dailyPct / 100, { damping: 16, stiffness: 80 });
    }, [dailyPct]);

    const ringStyle = useAnimatedStyle(() => ({
      width: `${ringProgress.value * 100}%`,
    }));

    return (
      <View>
        
        <Animated.View entering={FadeInDown.duration(400)} style={s.todayHero}>
          <Text style={s.todayPct}>{dailyPct}%</Text>
          <Text style={s.todayLabel}>av dagens mål</Text>
          <View style={s.todayBar}>
            <Animated.View style={[s.todayBarFill, ringStyle]} />
          </View>
        </Animated.View>

        
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={s.statsRow}>
          <View style={s.statBox}>
            <Ionicons name="water" size={20} color={colors.accent} />
            <Text style={s.statValue}>{todayIntake} ml</Text>
            <Text style={s.statLabel}>druckit</Text>
          </View>
          <View style={s.statBox}>
            <Feather name="target" size={20} color={colors.warning} />
            <Text style={s.statValue}>{dailyGoal} ml</Text>
            <Text style={s.statLabel}>mål</Text>
          </View>
          <View style={s.statBox}>
            <Ionicons name="water-outline" size={20} color={colors.accent} />
            <Text style={s.statValue}>{weightData.waterRemainingMl} ml</Text>
            <Text style={s.statLabel}>i flaskan</Text>
          </View>
        </Animated.View>

        
        {streak > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={s.streakCard}>
            <Ionicons name="flame" size={24} color={colors.warning} />
            <View style={{ marginLeft: 12 }}>
              <Text style={s.streakValue}>{streak} dagar i rad</Text>
              <Text style={s.streakLabel}>Du håller din streak igång!</Text>
            </View>
          </Animated.View>
        )}

        {isDemo && (
          <Animated.View entering={FadeInDown.duration(400).delay(300)} style={s.demoTag}>
            <Feather name="play-circle" size={14} color={colors.warning} />
            <Text style={s.demoTagText}>Demoläge - simulerad data</Text>
          </Animated.View>
        )}
      </View>
    );
  }

  function VeckaTab() {
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const days = (weeklyStats as any)?.dailyBreakdown ?? [];
    const weekTotal = weeklyStats?.totalMl ?? todayIntake;
    const weekAvg = days.length > 0 ? Math.round(weekTotal / Math.max(days.length, 1)) : todayIntake;

    const displayDays = isDemo
      ? demoWeekData
      : WEEKDAYS.map((label, i) => ({
          label,
          totalMl: days[i]?.totalMl || 0,
        }));

    const demoMax = Math.max(dailyGoal, ...displayDays.map(d => d.totalMl), 1);
    const sel = selectedDay !== null ? displayDays[selectedDay] : null;

    return (
      <View>
        
        <Animated.View entering={FadeInDown.duration(400)} style={s.chartCard}>
          <Text style={s.chartTitle}>Veckans intag</Text>
          <View style={s.barChart}>
            {displayDays.map((day, i) => (
              <AnimatedBar
                key={i}
                value={day.totalMl}
                maxValue={demoMax}
                index={i}
                label={day.label}
                goal={dailyGoal}
                selected={selectedDay === i}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedDay(selectedDay === i ? null : i);
                }}
              />
            ))}
          </View>
          
          <View style={[s.goalLine, { bottom: dailyGoal > 0 ? Math.max(4, (dailyGoal / demoMax) * 140) + 24 : 24 }]}>
            <View style={s.goalDash} />
            <Text style={s.goalText}>{dailyGoal} ml</Text>
          </View>
        </Animated.View>

        
        {sel && (
          <Animated.View entering={FadeInDown.duration(300)} style={s.dayDetailCard}>
            <View style={s.dayDetailHeader}>
              <Text style={s.dayDetailTitle}>{sel.label}</Text>
              <TouchableOpacity onPress={() => setSelectedDay(null)} hitSlop={12}>
                <Feather name="x" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={s.dayDetailRow}>
              <View style={s.dayDetailItem}>
                <Text style={s.dayDetailValue}>{sel.totalMl} ml</Text>
                <Text style={s.dayDetailLabel}>druckit</Text>
              </View>
              <View style={s.dayDetailItem}>
                <Text style={s.dayDetailValue}>{dailyGoal > 0 ? Math.round((sel.totalMl / dailyGoal) * 100) : 0}%</Text>
                <Text style={s.dayDetailLabel}>av mål</Text>
              </View>
              <View style={s.dayDetailItem}>
                <Text style={[s.dayDetailValue, { color: sel.totalMl >= dailyGoal ? colors.success : colors.accent }]}>
                  {sel.totalMl >= dailyGoal ? "Klart!" : `${dailyGoal - sel.totalMl} ml kvar`}
                </Text>
                <Text style={s.dayDetailLabel}>status</Text>
              </View>
            </View>
          </Animated.View>
        )}

        
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statValue}>{(weekTotal / 1000).toFixed(1)}L</Text>
            <Text style={s.statLabel}>totalt</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{weekAvg} ml</Text>
            <Text style={s.statLabel}>snitt/dag</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{store.weeklyGoalMl > 0 ? Math.round((weekTotal / store.weeklyGoalMl) * 100) : 0}%</Text>
            <Text style={s.statLabel}>veckomål</Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  function ManadTab() {
    const [selectedMonthDay, setSelectedMonthDay] = useState<number | null>(null);
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const today = new Date().getDate();

    const monthDays = isDemo ? demoMonthData : Array.from({ length: daysInMonth }, () => 0);

    const monthTotal = monthDays.reduce((a, b) => a + b, 0);
    const activeDays = monthDays.filter(d => d > 0).length;
    const monthAvg = activeDays > 0 ? Math.round(monthTotal / activeDays) : 0;

    return (
      <View>
        
        <Animated.View entering={FadeInDown.duration(400)} style={s.chartCard}>
          <Text style={s.chartTitle}>Månadsöversikt</Text>
          <View style={s.dayGrid}>
            {monthDays.map((ml, i) => {
              const pct = dailyGoal > 0 ? ml / dailyGoal : 0;
              const bg = ml === 0
                ? colors.surface
                : pct >= 1
                  ? colors.success
                  : pct >= 0.5
                    ? colors.accent
                    : colors.accent + "60";
              const isToday = i + 1 === today;
              const isSel = selectedMonthDay === i;
              return (
                <TouchableOpacity
                  key={i}
                  style={s.dayCell}
                  onPress={() => {
                    if (ml > 0) {
                      Haptics.selectionAsync();
                      setSelectedMonthDay(isSel ? null : i);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[s.dayDot, { backgroundColor: bg }, isToday && s.dayDotToday, isSel && { borderWidth: 2, borderColor: colors.textPrimary }]}>
                    <Text style={s.dayNum}>{i + 1}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          
          {selectedMonthDay !== null && monthDays[selectedMonthDay] > 0 && (
            <Animated.View entering={FadeInDown.duration(200)} style={s.dayDetailInline}>
              <Text style={s.dayDetailInlineTitle}>
                {selectedMonthDay + 1}/{new Date().getMonth() + 1}
              </Text>
              <Text style={s.dayDetailInlineValue}>{monthDays[selectedMonthDay]} ml</Text>
              <Text style={s.dayDetailInlinePct}>
                {dailyGoal > 0 ? Math.round((monthDays[selectedMonthDay] / dailyGoal) * 100) : 0}% av mål
              </Text>
            </Animated.View>
          )}

          <View style={s.legendRow}>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: colors.success }]} />
              <Text style={s.legendText}>Mål nått</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: colors.accent }]} />
              <Text style={s.legendText}>Delvis</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: colors.surface }]} />
              <Text style={s.legendText}>Ingen data</Text>
            </View>
          </View>
        </Animated.View>

        
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statValue}>{(monthTotal / 1000).toFixed(1)}L</Text>
            <Text style={s.statLabel}>totalt</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{monthAvg} ml</Text>
            <Text style={s.statLabel}>snitt/dag</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{activeDays}</Text>
            <Text style={s.statLabel}>aktiva dagar</Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  function TotaltTab() {
    const totalMl = isDemo ? todayIntake : (allTimeStats?.totalMl ?? 0);
    const totalDrinks = isDemo ? 1 : ((allTimeStats as any)?.totalDrinks ?? 0);
    const avgDaily = isDemo ? todayIntake : ((allTimeStats as any)?.averageDailyMl ?? 0);
    const daysTracked = isDemo ? 1 : ((allTimeStats as any)?.activeDays ?? 0);
    const bestStreak = isDemo ? 0 : (streakStats?.longestStreak ?? 0);

    const MILESTONES = [
      { threshold: 10000, label: "10 liter" },
      { threshold: 50000, label: "50 liter" },
      { threshold: 100000, label: "100 liter" },
      { threshold: 500000, label: "500 liter" },
      { threshold: 1000000, label: "1 000 liter" },
    ];

    return (
      <View>
        
        <Animated.View entering={FadeInDown.duration(400)} style={s.statsRow}>
          <View style={s.statBox}>
            <Ionicons name="water" size={20} color={colors.accent} />
            <Text style={s.statValue}>{(totalMl / 1000).toFixed(1)}L</Text>
            <Text style={s.statLabel}>totalt</Text>
          </View>
          <View style={s.statBox}>
            <Feather name="calendar" size={20} color={colors.accent} />
            <Text style={s.statValue}>{daysTracked}</Text>
            <Text style={s.statLabel}>dagar</Text>
          </View>
          <View style={s.statBox}>
            <Feather name="trending-up" size={20} color={colors.accent} />
            <Text style={s.statValue}>{avgDaily} ml</Text>
            <Text style={s.statLabel}>snitt/dag</Text>
          </View>
        </Animated.View>

        {bestStreak > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={s.streakCard}>
            <Ionicons name="trophy" size={24} color={colors.warning} />
            <View style={{ marginLeft: 12 }}>
              <Text style={s.streakValue}>Bästa streak: {bestStreak} dagar</Text>
              <Text style={s.streakLabel}>Nuvarande: {streak} dagar</Text>
            </View>
          </Animated.View>
        )}

        
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={s.chartCard}>
          <Text style={s.chartTitle}>Milstolpar</Text>
          {MILESTONES.map((ms, i) => {
            const reached = totalMl >= ms.threshold;
            const progress = Math.min(1, totalMl / ms.threshold);
            return (
              <View key={i} style={s.milestoneRow}>
                <Feather
                  name={reached ? "check-circle" : "circle"}
                  size={18}
                  color={reached ? colors.success : colors.textMuted}
                />
                <Text style={[s.milestoneLabel, reached && { color: colors.success }]}>
                  {ms.label}
                </Text>
                <View style={s.milestoneBar}>
                  <View style={[s.milestoneFill, { width: `${progress * 100}%`, backgroundColor: reached ? colors.success : colors.accent }]} />
                </View>
              </View>
            );
          })}
        </Animated.View>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Animated.View entering={FadeInDown.duration(300)} style={s.header}>
          <Text style={s.pageTitle}>Statistik</Text>
          {isDemo && (
            <View style={s.demoBadge}>
              <Feather name="play-circle" size={12} color={colors.warning} />
              <Text style={s.demoBadgeText}>Demo</Text>
            </View>
          )}
        </Animated.View>

        
        <View style={s.tabRow}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[s.tab, active && s.tabActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab(tab.key);
                }}
                activeOpacity={0.7}
              >
                <Text style={[s.tabText, active && s.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        
        {activeTab === "idag" && <IdagTab />}
        {activeTab === "vecka" && <VeckaTab />}
        {activeTab === "manad" && <ManadTab />}
        {activeTab === "totalt" && <TotaltTab />}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.page, paddingTop: 8, paddingBottom: 12 },
  pageTitle: { ...typography.header },
  demoBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.warningMuted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  demoBadgeText: { fontSize: 11, fontWeight: "600", color: colors.warning },

  tabRow: { flexDirection: "row", marginHorizontal: spacing.page, marginBottom: 20, backgroundColor: colors.surface, borderRadius: 12, padding: 3 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: colors.accent },
  tabText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  tabTextActive: { color: "#FFF" },

  todayHero: { alignItems: "center", paddingVertical: 24, marginHorizontal: spacing.page },
  todayPct: { fontSize: 64, fontWeight: "800", color: colors.textPrimary, letterSpacing: -3 },
  todayLabel: { fontSize: 15, color: colors.textSecondary, marginTop: -4 },
  todayBar: { width: "100%", height: 8, backgroundColor: colors.surface, borderRadius: 4, marginTop: 16, overflow: "hidden" },
  todayBarFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 4 },

  statsRow: { flexDirection: "row", marginHorizontal: spacing.page, marginBottom: 16, gap: 10 },
  statBox: { flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: 18, fontWeight: "800", color: colors.textPrimary, marginTop: 6 },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  streakCard: { flexDirection: "row", alignItems: "center", marginHorizontal: spacing.page, marginBottom: 16, backgroundColor: colors.warningMuted, borderRadius: 14, padding: 16 },
  streakValue: { fontSize: 16, fontWeight: "700", color: colors.warning },
  streakLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  demoTag: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginHorizontal: spacing.page, paddingVertical: 8, marginBottom: 16 },
  demoTagText: { fontSize: 12, fontWeight: "500", color: colors.warning },

  chartCard: { marginHorizontal: spacing.page, marginBottom: 16, backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
  chartTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginBottom: 16 },

  barChart: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 160, paddingTop: 20 },
  barCol: { flex: 1, alignItems: "center" },
  barTrack: { width: "65%", height: 140, justifyContent: "flex-end", alignItems: "center" },
  bar: { width: "100%", borderRadius: 6, minHeight: 4 },
  barLabel: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  goalLine: { position: "absolute", left: 16, right: 16, flexDirection: "row", alignItems: "center" },
  goalDash: { flex: 1, height: 1, backgroundColor: colors.textMuted, opacity: 0.3 },
  goalText: { fontSize: 10, color: colors.textMuted, marginLeft: 6 },

  dayGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  dayCell: { width: (SW - spacing.page * 2 - 32 - 4 * 6) / 7 },
  dayDot: { aspectRatio: 1, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  dayDotToday: { borderWidth: 2, borderColor: colors.accent },
  dayNum: { fontSize: 10, fontWeight: "600", color: colors.textPrimary },
  legendRow: { flexDirection: "row", marginTop: 12, gap: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: colors.textMuted },

  barTooltip: { alignItems: "center", marginBottom: 4 },
  barTooltipText: { fontSize: 13, fontWeight: "800", color: colors.textPrimary },
  barTooltipUnit: { fontSize: 9, fontWeight: "500", color: colors.textMuted, marginTop: -2 },
  barLabelSel: { color: colors.accent, fontWeight: "700" },

  dayDetailCard: { marginHorizontal: spacing.page, marginBottom: 16, backgroundColor: colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border },
  dayDetailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  dayDetailTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  dayDetailRow: { flexDirection: "row", gap: 10 },
  dayDetailItem: { flex: 1, alignItems: "center" },
  dayDetailValue: { fontSize: 16, fontWeight: "800", color: colors.textPrimary },
  dayDetailLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  dayDetailInline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.background, borderRadius: 10, padding: 10, marginTop: 12 },
  dayDetailInlineTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  dayDetailInlineValue: { fontSize: 16, fontWeight: "800", color: colors.accent },
  dayDetailInlinePct: { fontSize: 12, color: colors.textMuted },

  milestoneRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  milestoneLabel: { flex: 1, fontSize: 14, fontWeight: "500", color: colors.textSecondary, marginLeft: 10 },
  milestoneBar: { width: 60, height: 4, backgroundColor: colors.surface, borderRadius: 2, overflow: "hidden" },
  milestoneFill: { height: "100%", borderRadius: 2 },
});
