import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../../stores/authStore";
import { Ionicons } from "@expo/vector-icons";
import { WeeklyBarChart } from "../../components/charts/WeeklyBarChart";
import { MonthlyCalendar } from "../../components/charts/MonthlyCalendar";
import { LevelProgress } from "../../components/gamification/LevelProgress";
import { StreakBadge } from "../../components/gamification/StreakBadge";
import { AchievementBadge } from "../../components/gamification/AchievementBadge";
import { formatMl, formatLiters } from "../../utils/formatting";

type TimeRange = "week" | "month" | "year" | "all";

export default function Stats() {
  const { token } = useAuthStore();
  const [timeRange, setTimeRange] = useState<TimeRange>("week");

  const weeklyStats = useQuery(api.stats.getWeekly, token ? { token } : "skip");
  const monthlyStats = useQuery(
    api.stats.getMonthly,
    token ? { token } : "skip"
  );
  const allTimeStats = useQuery(
    api.stats.getAllTime,
    token ? { token } : "skip"
  );
  const streak = useQuery(api.stats.getStreak, token ? { token } : "skip");
  const achievements = useQuery(
    api.achievements.list,
    token ? { token } : "skip"
  );

  const currentStats =
    timeRange === "week"
      ? weeklyStats
      : timeRange === "month"
        ? monthlyStats
        : allTimeStats;

  const unlockedAchievements =
    achievements?.filter((a) => a.unlocked).length || 0;
  const totalAchievements = achievements?.length || 0;

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        <View className="px-6 pt-4 pb-2">
          <Text className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            Statistics
          </Text>
        </View>

        
        <View className="px-6 py-4">
          <View className="flex-row bg-surface-light dark:bg-surface-dark rounded-xl p-1">
            {(["week", "month", "year", "all"] as TimeRange[]).map((range) => (
              <TouchableOpacity
                key={range}
                className={`flex-1 py-2 rounded-lg ${
                  timeRange === range ? "bg-primary-500" : ""
                }`}
                onPress={() => setTimeRange(range)}
              >
                <Text
                  className={`text-center font-medium text-xs ${
                    timeRange === range
                      ? "text-white"
                      : "text-text-light-secondary dark:text-text-dark-secondary"
                  }`}
                >
                  {range === "week"
                    ? "Week"
                    : range === "month"
                      ? "Month"
                      : range === "year"
                        ? "Year"
                        : "All"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        
        <View className="px-6 pb-4">
          <View className="flex-row flex-wrap -mx-2">
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4">
                <View className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full items-center justify-center mb-2">
                  <Ionicons name="water" size={20} color="#0EA5E9" />
                </View>
                <Text className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                  {currentStats
                    ? formatLiters(currentStats.totalMl)
                    : "0L"}
                </Text>
                <Text className="text-xs text-text-light-muted dark:text-text-dark-muted">
                  Total Consumed
                </Text>
              </View>
            </View>

            <View className="w-1/2 px-2 mb-4">
              <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4">
                <View className="w-10 h-10 bg-success-100 dark:bg-success-900 rounded-full items-center justify-center mb-2">
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                </View>
                <Text className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                  {(currentStats as any)?.daysGoalMet || 0}
                </Text>
                <Text className="text-xs text-text-light-muted dark:text-text-dark-muted">
                  Days Goal Met
                </Text>
              </View>
            </View>

            <View className="w-1/2 px-2 mb-4">
              <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4">
                <View className="w-10 h-10 bg-secondary-100 dark:bg-secondary-900 rounded-full items-center justify-center mb-2">
                  <Ionicons name="trending-up" size={20} color="#319795" />
                </View>
                <Text className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                  {currentStats
                    ? formatLiters((currentStats as any).averageDailyMl || 0)
                    : "0L"}
                </Text>
                <Text className="text-xs text-text-light-muted dark:text-text-dark-muted">
                  Daily Average
                </Text>
              </View>
            </View>

            <View className="w-1/2 px-2 mb-4">
              <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4">
                <View className="w-10 h-10 bg-warning-100 dark:bg-warning-900 rounded-full items-center justify-center mb-2">
                  <Text className="text-lg">🔥</Text>
                </View>
                <Text className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                  {allTimeStats?.currentStreak || 0}
                </Text>
                <Text className="text-xs text-text-light-muted dark:text-text-dark-muted">
                  Current Streak
                </Text>
              </View>
            </View>
          </View>
        </View>

        
        {timeRange === "week" && weeklyStats?.dailyBreakdown && (
          <View className="px-6 pb-4">
            <Text className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
              This Week
            </Text>
            <WeeklyBarChart data={weeklyStats.dailyBreakdown} />
          </View>
        )}

        
        {timeRange === "month" && monthlyStats?.dailyBreakdown && (
          <View className="px-6 pb-4">
            <MonthlyCalendar
              data={monthlyStats.dailyBreakdown}
              monthName={monthlyStats.monthName}
              year={monthlyStats.year}
            />
          </View>
        )}

        
        {timeRange === "year" && (
          <View className="px-6 pb-4">
            <Text className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
              {new Date().getFullYear()} Overview
            </Text>
            <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4">
              
              <View className="flex-row flex-wrap">
                {Array.from({ length: 12 }, (_, i) => {
                  const monthName = new Date(new Date().getFullYear(), i).toLocaleDateString("en-US", { month: "short" });
                  const isCurrentMonth = i === new Date().getMonth();
                  const isPastMonth = i < new Date().getMonth();
                  return (
                    <View key={i} className="w-1/4 p-1.5">
                      <View
                        className={`rounded-xl p-3 items-center ${
                          isCurrentMonth
                            ? "bg-primary-100 dark:bg-primary-900 border border-primary-300 dark:border-primary-700"
                            : isPastMonth
                              ? "bg-gray-50 dark:bg-gray-800"
                              : "bg-gray-50/50 dark:bg-gray-800/50"
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            isCurrentMonth
                              ? "text-primary-500"
                              : isPastMonth
                                ? "text-text-light-primary dark:text-text-dark-primary"
                                : "text-text-light-muted dark:text-text-dark-muted"
                          }`}
                        >
                          {monthName}
                        </Text>
                        {isCurrentMonth && monthlyStats ? (
                          <Text className="text-sm font-bold text-primary-500 mt-1">
                            {formatLiters(monthlyStats.totalMl)}
                          </Text>
                        ) : (
                          <Text className="text-sm font-bold text-text-light-muted dark:text-text-dark-muted mt-1">
                            --
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
              <Text className="text-[10px] text-text-light-muted dark:text-text-dark-muted text-center mt-3">
                Monthly data loads as you use the app
              </Text>
            </View>
          </View>
        )}

        
        {timeRange === "all" && allTimeStats && (
          <View className="px-6 pb-4">
            <Text className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
              All Time
            </Text>
            <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4">
              <View className="flex-row justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <View className="items-center flex-1">
                  <Text className="text-2xl font-bold text-primary-500">
                    {allTimeStats.totalLiters}L
                  </Text>
                  <Text className="text-[10px] text-text-light-muted dark:text-text-dark-muted">
                    Total
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-2xl font-bold text-secondary-500">
                    {allTimeStats.totalDrinks}
                  </Text>
                  <Text className="text-[10px] text-text-light-muted dark:text-text-dark-muted">
                    Drinks
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-2xl font-bold text-success-500">
                    {allTimeStats.activeDays}
                  </Text>
                  <Text className="text-[10px] text-text-light-muted dark:text-text-dark-muted">
                    Active Days
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between">
                <View className="items-center flex-1">
                  <Text className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                    {formatLiters(allTimeStats.averageDailyMl)}
                  </Text>
                  <Text className="text-[10px] text-text-light-muted dark:text-text-dark-muted">
                    Daily Avg
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                    {allTimeStats.longestStreak}
                  </Text>
                  <Text className="text-[10px] text-text-light-muted dark:text-text-dark-muted">
                    Best Streak
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                    {allTimeStats.daysGoalMet}
                  </Text>
                  <Text className="text-[10px] text-text-light-muted dark:text-text-dark-muted">
                    Goals Met
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        
        <View className="px-6 pb-4">
          <Text className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
            Streak
          </Text>
          <StreakBadge
            currentStreak={streak?.currentStreak || 0}
            longestStreak={streak?.longestStreak || 0}
          />
        </View>

        
        <View className="px-6 pb-4">
          <Text className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
            Level Progress
          </Text>
          <LevelProgress
            level={allTimeStats?.level || 1}
            xp={allTimeStats?.xp || 0}
          />
        </View>

        
        <View className="px-6 pb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
              Achievements
            </Text>
            <TouchableOpacity onPress={() => router.push("/achievements")}>
              <Text className="text-sm text-primary-500 font-medium">
                {unlockedAchievements}/{totalAchievements} - See All
              </Text>
            </TouchableOpacity>
          </View>
          <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4">
            <View className="flex-row flex-wrap justify-center">
              {achievements?.slice(0, 8).map((achievement) => (
                <View key={achievement._id} className="m-1">
                  <AchievementBadge
                    icon={achievement.icon}
                    name={achievement.name}
                    description={achievement.description}
                    xpReward={achievement.xpReward}
                    unlocked={achievement.unlocked}
                    size="small"
                    onPress={() => router.push("/achievements")}
                  />
                </View>
              ))}
            </View>
            {achievements && achievements.length > 8 && (
              <TouchableOpacity
                className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 items-center"
                onPress={() => router.push("/achievements")}
              >
                <Text className="text-sm text-primary-500 font-medium">
                  View all {totalAchievements} achievements
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
