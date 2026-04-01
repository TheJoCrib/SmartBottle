import { useState } from "react";
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
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { colors, spacing, typography } from "../../constants/theme";

type TabKey = "vecka" | "manad" | "ar" | "totalt";

const TABS: { key: TabKey; label: string }[] = [
  { key: "vecka", label: "Vecka" },
  { key: "manad", label: "Månad" },
  { key: "ar", label: "År" },
  { key: "totalt", label: "Totalt" },
];

const WEEKDAY_LABELS = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "Maj", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dec",
];

const SCREEN_WIDTH = Dimensions.get("window").width;

const MILESTONES = [
  { threshold: 10, label: "10 liter totalt" },
  { threshold: 50, label: "50 liter totalt" },
  { threshold: 100, label: "100 liter totalt" },
  { threshold: 250, label: "250 liter totalt" },
  { threshold: 500, label: "500 liter totalt" },
  { threshold: 1000, label: "1 000 liter totalt" },
];

export default function Stats() {
  const { token } = useAuthStore();
  const store = useHydrationStore();
  const [activeTab, setActiveTab] = useState<TabKey>("vecka");

  const skipArg = token ? { token } : "skip" as const;

  const todayStats = useQuery(api.stats.getToday, skipArg);
  const weeklyStats = useQuery(api.stats.getWeekly, skipArg);
  const monthlyStats = useQuery(api.stats.getMonthly, skipArg);
  const yearStats = useQuery(api.stats.getAllTime, skipArg);
  const allTimeStats = useQuery(api.stats.getAllTime, skipArg);
  const streakStats = useQuery(api.stats.getStreak, skipArg);

  function ProgressRing({
    percentage,
    size = 180,
    strokeWidth = 14,
  }: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
  }) {
    const clampedPct = Math.min(Math.max(percentage, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;
    const segmentCount = 60;
    const filledSegments = Math.round((clampedPct / 100) * segmentCount);

    return (
      <View style={[styles.ringContainer, { width: size, height: size }]}>
        
        {Array.from({ length: segmentCount }).map((_, i) => {
          const angle = (i / segmentCount) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const dotX = center + radius * Math.cos(rad);
          const dotY = center + radius * Math.sin(rad);
          const isFilled = i < filledSegments;
          return (
            <View
              key={i}
              style={[
                styles.ringDot,
                {
                  left: dotX - 3,
                  top: dotY - 3,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: isFilled
                    ? colors.primary
                    : colors.surface,
                },
              ]}
            />
          );
        })}
        
        <View style={styles.ringCenter}>
          <Text style={[typography.bigNumber, { fontSize: 44 }]}>
            {Math.round(clampedPct)}
          </Text>
          <Text style={[typography.caption, { marginTop: -4 }]}>%</Text>
        </View>
      </View>
    );
  }

  function DagTab() {
    const pct = todayStats?.percentage ?? 0;
    const totalMl = todayStats?.totalMl ?? 0;
    const goalMl = todayStats?.goalMl ?? store.dailyGoalMl;
    const drinkCount = todayStats?.drinkCount ?? 0;
    const currentStreak = streakStats?.currentStreak ?? 0;

    return (
      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        
        <View style={styles.card}>
          <View style={styles.ringWrapper}>
            <ProgressRing percentage={pct} />
          </View>
          <Text style={styles.mlText}>
            {totalMl} / {goalMl} ml
          </Text>
          <View style={styles.drinkCountRow}>
            <Ionicons name="water-outline" size={16} color={colors.primary} />
            <Text style={styles.drinkCountText}>
              {drinkCount} drycker idag
            </Text>
          </View>
        </View>

        
        <View style={styles.card}>
          <View style={styles.streakRow}>
            <View style={styles.streakIconWrap}>
              <Ionicons name="flame" size={24} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.streakTitle}>
                {currentStreak} dagar i rad
              </Text>
              <Text style={styles.streakSubtitle}>
                Längsta: {streakStats?.longestStreak ?? 0} dagar
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  }

  function VeckaTab() {
    const days = (weeklyStats as any)?.dailyBreakdown ?? [];
    const maxMl = Math.max(
      store.dailyGoalMl,
      ...days.map((d: any) => d.totalMl)
    );
    const barAreaHeight = 160;
    const goalLineY =
      maxMl > 0
        ? barAreaHeight - (store.dailyGoalMl / maxMl) * barAreaHeight
        : barAreaHeight;

    const weeklyTotal = weeklyStats?.totalMl ?? 0;
    const weeklyAvg = (weeklyStats as any)?.averageDailyMl ?? 0;
    const weeklyProgress = store.getWeeklyProgress(weeklyTotal);

    return (
      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Veckans översikt</Text>
          <View style={styles.barChartContainer}>
            
            <View
              style={[
                styles.goalLine,
                { top: goalLineY },
              ]}
            />
            <Text
              style={[
                styles.goalLineLabel,
                { top: goalLineY - 16 },
              ]}
            >
              Mål
            </Text>
            
            <View style={styles.barsRow}>
              {WEEKDAY_LABELS.map((label, i) => {
                const day = days[i];
                const ml = day?.totalMl ?? 0;
                const barH = maxMl > 0 ? (ml / maxMl) * barAreaHeight : 0;
                const metGoal = day ? ml >= (day.goalMl ?? store.dailyGoalMl) : false;
                return (
                  <View key={label} style={styles.barColumn}>
                    <View style={styles.barWrapper}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: Math.max(barH, 4),
                            backgroundColor: metGoal
                              ? colors.success
                              : colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        
        <View style={styles.card}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{(weeklyTotal / 1000).toFixed(1)} L</Text>
              <Text style={styles.statLabel}>Totalt denna vecka</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(weeklyAvg)} ml</Text>
              <Text style={styles.statLabel}>Genomsnitt per dag</Text>
            </View>
          </View>
        </View>

        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Veckomål</Text>
          <View style={styles.goalProgressRow}>
            <Text style={styles.goalProgressText}>
              {(weeklyTotal / 1000).toFixed(1)} / {(store.weeklyGoalMl / 1000).toFixed(1)} L
            </Text>
            <Text style={styles.goalProgressPct}>
              {Math.round(weeklyProgress * 100)}%
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(weeklyProgress * 100, 100)}%` },
              ]}
            />
          </View>
        </View>
      </Animated.View>
    );
  }

  function ManadTab() {
    const days = (monthlyStats as any)?.dailyBreakdown ?? [];
    const totalMl = monthlyStats?.totalMl ?? 0;
    const averageMl = (monthlyStats as any)?.averageDailyMl ?? 0;
    const daysGoalMet = monthlyStats?.daysGoalMet ?? 0;
    const monthlyProgress = store.getMonthlyProgress(totalMl);

    const dayCount = days.length || 30;

    return (
      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daglig översikt</Text>
          <View style={styles.dayGrid}>
            {Array.from({ length: dayCount }).map((_, i) => {
              const day = days[i];
              const ml = day?.totalMl ?? 0;
              const goal = day?.goalMl ?? store.dailyGoalMl;
              const pct = goal > 0 ? Math.min(ml / goal, 1) : 0;
              const opacity = pct > 0 ? 0.15 + pct * 0.85 : 0;
              return (
                <View key={i} style={styles.dayCircleWrap}>
                  <View
                    style={[
                      styles.dayCircle,
                      {
                        backgroundColor:
                          pct > 0
                            ? `rgba(59, 130, 246, ${opacity})`
                            : colors.surface,
                        borderWidth: pct >= 1 ? 2 : 0,
                        borderColor: pct >= 1 ? colors.success : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayCircleText,
                        {
                          color:
                            pct > 0.5
                              ? "#FFFFFF"
                              : colors.textMuted,
                        },
                      ]}
                    >
                      {i + 1}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
          
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "rgba(59, 130, 246, 0.2)" }]}
              />
              <Text style={styles.legendText}>Lite</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "rgba(59, 130, 246, 0.6)" }]}
              />
              <Text style={styles.legendText}>Halvvägs</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor: colors.primary,
                    borderWidth: 2,
                    borderColor: colors.success,
                  },
                ]}
              />
              <Text style={styles.legendText}>Mål nått</Text>
            </View>
          </View>
        </View>

        
        <View style={styles.card}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{(totalMl / 1000).toFixed(1)} L</Text>
              <Text style={styles.statLabel}>Totalt</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(averageMl)} ml</Text>
              <Text style={styles.statLabel}>Genomsnitt/dag</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{daysGoalMet}</Text>
              <Text style={styles.statLabel}>Mål uppnått</Text>
            </View>
          </View>
        </View>

        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Månadsmål</Text>
          <View style={styles.goalProgressRow}>
            <Text style={styles.goalProgressText}>
              {(totalMl / 1000).toFixed(1)} / {(store.monthlyGoalMl / 1000).toFixed(1)} L
            </Text>
            <Text style={styles.goalProgressPct}>
              {Math.round(monthlyProgress * 100)}%
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(monthlyProgress * 100, 100)}%` },
              ]}
            />
          </View>
        </View>
      </Animated.View>
    );
  }

  function ArTab() {
    const months = (yearStats as any)?.months ?? MONTH_LABELS.map((_, i) => ({ month: i + 1, totalMl: 0 }));
    const maxMl = Math.max(1, ...months.map((m: any) => m.totalMl));
    const barAreaHeight = 160;
    const yearTotal = yearStats?.totalMl ?? 0;
    const yearAvg = (yearStats as any)?.averageDailyMl ?? 0;

    return (
      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Årsöversikt {new Date().getFullYear()}</Text>
          <View style={[styles.barChartContainer, { height: barAreaHeight + 32 }]}>
            <View style={styles.barsRow}>
              {MONTH_LABELS.map((label, i) => {
                const month = months[i];
                const ml = month?.totalMl ?? 0;
                const barH = maxMl > 0 ? (ml / maxMl) * barAreaHeight : 0;
                return (
                  <View key={label} style={styles.barColumnNarrow}>
                    <View style={[styles.barWrapper, { height: barAreaHeight }]}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: Math.max(barH, 2),
                            backgroundColor: colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabelSmall}>{label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        
        <View style={styles.card}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{(yearTotal / 1000).toFixed(1)} L</Text>
              <Text style={styles.statLabel}>Totalt i år</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(yearAvg)} ml</Text>
              <Text style={styles.statLabel}>Genomsnitt/dag</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  }

  function TotaltTab() {
    const totalMl = allTimeStats?.totalMl ?? 0;
    const totalDrinks = allTimeStats?.totalDrinks ?? 0;
    const averageMl = (allTimeStats as any)?.averageDailyMl ?? 0;
    const daysTracked = (allTimeStats as any)?.activeDays ?? 0;
    const currentStreak = streakStats?.currentStreak ?? 0;
    const longestStreak = streakStats?.longestStreak ?? 0;
    const totalLiters = totalMl / 1000;

    const statCards: {
      icon: React.ReactNode;
      value: string;
      label: string;
    }[] = [
      {
        icon: <Ionicons name="water" size={22} color={colors.primary} />,
        value: `${totalLiters.toFixed(1)} L`,
        label: "Totalt druckit",
      },
      {
        icon: <MaterialCommunityIcons name="cup-water" size={22} color={colors.primaryLight} />,
        value: `${totalDrinks}`,
        label: "Antal drycker",
      },
      {
        icon: <Feather name="bar-chart-2" size={22} color={colors.waterMid} />,
        value: `${Math.round(averageMl)} ml`,
        label: "Genomsnitt per dag",
      },
      {
        icon: <Feather name="calendar" size={22} color={colors.success} />,
        value: `${daysTracked}`,
        label: "Dagar spårade",
      },
      {
        icon: <Ionicons name="flame" size={22} color="#F59E0B" />,
        value: `${longestStreak}`,
        label: "Bästa streak",
      },
      {
        icon: <Ionicons name="flame-outline" size={22} color="#FB923C" />,
        value: `${currentStreak}`,
        label: "Nuvarande streak",
      },
    ];

    return (
      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        
        <View style={styles.statsGrid}>
          {statCards.map((card, i) => (
            <View key={i} style={styles.statCard}>
              <View style={styles.statCardIcon}>{card.icon}</View>
              <Text style={styles.statCardValue}>{card.value}</Text>
              <Text style={styles.statCardLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Milstolpar</Text>
          {MILESTONES.map((ms, i) => {
            const achieved = totalLiters >= ms.threshold;
            return (
              <View
                key={i}
                style={[
                  styles.milestoneRow,
                  i < MILESTONES.length - 1 && styles.milestoneBorder,
                ]}
              >
                <View
                  style={[
                    styles.milestoneIcon,
                    {
                      backgroundColor: achieved
                        ? "rgba(16, 185, 129, 0.15)"
                        : colors.surface,
                    },
                  ]}
                >
                  {achieved ? (
                    <Feather name="award" size={20} color={colors.success} />
                  ) : (
                    <Feather name="lock" size={18} color={colors.textMuted} />
                  )}
                </View>
                <Text
                  style={[
                    styles.milestoneLabel,
                    {
                      color: achieved
                        ? colors.textPrimary
                        : colors.textMuted,
                    },
                  ]}
                >
                  {ms.label}
                </Text>
                {achieved && (
                  <Feather name="check-circle" size={18} color={colors.success} />
                )}
              </View>
            );
          })}
        </View>
      </Animated.View>
    );
  }

  function renderTabContent() {
    switch (activeTab) {
      case "vecka":
        return <VeckaTab />;
      case "manad":
        return <ManadTab />;
      case "ar":
        return <ArTab />;
      case "totalt":
        return <TotaltTab />;
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        <Animated.View
          entering={FadeInDown.duration(400).delay(50)}
          style={styles.header}
        >
          <Text style={typography.header}>Statistik</Text>
        </Animated.View>

        
        <Animated.View
          entering={FadeInDown.duration(400).delay(80)}
          style={styles.tabRow}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabButton,
                  isActive && styles.tabButtonActive,
                ]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    isActive && styles.tabButtonTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  header: {
    paddingHorizontal: spacing.page,
    paddingTop: 16,
    paddingBottom: 8,
  },

  tabRow: {
    flexDirection: "row",
    marginHorizontal: spacing.page,
    marginBottom: spacing.sectionGap,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.cardRadius,
    padding: spacing.cardPadding,
    marginHorizontal: spacing.page,
    marginBottom: spacing.sectionGap,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    ...typography.title,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
  },

  ringContainer: {
    position: "relative",
  },
  ringDot: {
    position: "absolute",
  },
  ringCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  ringWrapper: {
    alignItems: "center",
    paddingVertical: 16,
  },

  mlText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 8,
  },
  drinkCountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 6,
  },
  drinkCountText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },

  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  streakIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  streakSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textMuted,
    marginTop: 2,
  },

  barChartContainer: {
    height: 192,
    position: "relative",
  },
  goalLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: 1,
    borderTopColor: colors.textMuted,
  },
  goalLineLabel: {
    position: "absolute",
    right: 0,
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    flex: 1,
    gap: 4,
    paddingBottom: 24,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
  },
  barColumnNarrow: {
    flex: 1,
    alignItems: "center",
  },
  barWrapper: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    width: "65%",
    borderRadius: 4,
    minHeight: 2,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    marginTop: 6,
  },
  barLabelSmall: {
    fontSize: 9,
    fontWeight: "600",
    color: colors.textMuted,
    marginTop: 6,
  },

  statRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textMuted,
    marginTop: 4,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },

  goalProgressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  goalProgressText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  goalProgressPct: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },

  dayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-start",
  },
  dayCircleWrap: {
    width: (SCREEN_WIDTH - spacing.page * 2 - spacing.cardPadding * 2 - 6 * 6) / 7,
    aspectRatio: 1,
  },
  dayCircle: {
    flex: 1,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleText: {
    fontSize: 11,
    fontWeight: "600",
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textMuted,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.page,
    gap: spacing.itemGap,
    marginBottom: spacing.sectionGap,
  },
  statCard: {
    width: (SCREEN_WIDTH - spacing.page * 2 - spacing.itemGap) / 2,
    backgroundColor: colors.surface,
    borderRadius: spacing.cardRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statCardValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  statCardLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textMuted,
    marginTop: 4,
  },

  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  milestoneBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  milestoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
});
