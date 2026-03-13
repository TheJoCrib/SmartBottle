import { useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../../stores/authStore";
import { useBottleStore } from "../../stores/bottleStore";
import { Ionicons } from "@expo/vector-icons";
import { WaterProgressRing } from "../../components/ui/WaterProgressRing";
import { QuickLogButton } from "../../components/ui/QuickLogButton";
import { BottleCard } from "../../components/bottle/BottleCard";
import { StreakBadge } from "../../components/gamification/StreakBadge";
import { LevelProgress } from "../../components/gamification/LevelProgress";
import { useNotifications } from "../../hooks/useNotifications";
import {
  getMotivationalMessage,
  calculateHourlyRate,
  getHoursRemaining,
} from "../../utils/hydration";
import { formatMl } from "../../utils/formatting";

export default function Home() {
  const { token } = useAuthStore();
  const { currentWeight, isConnected, connectedDeviceId } = useBottleStore();

  const user = useQuery(api.auth.validateSession, token ? { token } : "skip");
  const todayStats = useQuery(api.stats.getToday, token ? { token } : "skip");
  const bottles = useQuery(api.bottles.list, token ? { token } : "skip");
  const streak = useQuery(api.stats.getStreak, token ? { token } : "skip");

  useNotifications();

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark items-center justify-center">
        <Text className="text-text-light-secondary dark:text-text-dark-secondary">
          Loading...
        </Text>
      </SafeAreaView>
    );
  }

  const percentage = todayStats?.percentage || 0;
  const totalMl = todayStats?.totalMl || 0;
  const goalMl = todayStats?.goalMl || user.dailyGoalMl;
  const remainingMl = Math.max(0, goalMl - totalMl);
  const hoursLeft = getHoursRemaining();
  const hourlyRate = hoursLeft > 0 ? calculateHourlyRate(totalMl, goalMl, hoursLeft) : 0;
  const motivationalMessage = getMotivationalMessage(percentage);

  const connectedBottle = bottles?.find(
    (b) => b.bleDeviceId === connectedDeviceId
  );

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        <View className="px-6 pt-4 pb-2">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Welcome back,
              </Text>
              <Text className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                {user.name}
              </Text>
            </View>
            <View className="flex-row items-center space-x-2">
              
              {streak && streak.currentStreak > 0 && (
                <StreakBadge
                  currentStreak={streak.currentStreak}
                  longestStreak={streak.longestStreak}
                  compact
                />
              )}
              
              <View className="flex-row items-center bg-primary-100 dark:bg-primary-900 px-3 py-1.5 rounded-full">
                <Text className="text-primary-700 dark:text-primary-300 font-semibold">
                  Lv.{user.level}
                </Text>
              </View>
            </View>
          </View>
        </View>

        
        <View className="px-6 py-6">
          <View className="bg-surface-light dark:bg-surface-dark rounded-3xl p-6 items-center shadow-sm">
            <WaterProgressRing
              percentage={percentage}
              currentMl={totalMl}
              goalMl={goalMl}
              size={220}
            />
            <Text className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-4">
              {motivationalMessage}
            </Text>

            
            {percentage < 100 && hoursLeft > 0 && (
              <View className="flex-row items-center mt-2 bg-primary-50 dark:bg-primary-900/30 px-4 py-2 rounded-full">
                <Ionicons name="time-outline" size={14} color="#0EA5E9" />
                <Text className="text-xs text-primary-600 dark:text-primary-400 ml-1">
                  Drink ~{formatMl(hourlyRate)}/hr to meet your goal
                </Text>
              </View>
            )}
          </View>
        </View>

        
        <View className="px-6 pb-4">
          <Text className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
            Quick Log
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-2"
          >
            <QuickLogButton amount={100} icon="💧" label="100ml" />
            <QuickLogButton amount={200} icon="🥤" label="200ml" />
            <QuickLogButton amount={250} icon="🫗" label="250ml" />
            <QuickLogButton amount={500} icon="🍶" label="500ml" />
            <TouchableOpacity
              className="mx-2 items-center justify-center w-20 h-20 bg-primary-50 dark:bg-primary-900 rounded-2xl border-2 border-dashed border-primary-300"
              onPress={() => router.push("/drink/log")}
            >
              <Ionicons name="add" size={32} color="#0EA5E9" />
              <Text className="text-xs text-primary-500 mt-1">Custom</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        
        {isConnected && connectedBottle && (
          <View className="px-6 pb-4">
            <Text className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
              Live Bottle
            </Text>
            <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: connectedBottle.color + "30" }}
                  >
                    <Text className="text-2xl">{connectedBottle.icon}</Text>
                  </View>
                  <View>
                    <Text className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                      {connectedBottle.name}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                      <View className="w-2 h-2 bg-success-500 rounded-full mr-1.5" />
                      <Text className="text-xs text-success-500">Connected</Text>
                    </View>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-2xl font-bold text-primary-500">
                    {Math.round(currentWeight ?? 0)}g
                  </Text>
                  <Text className="text-[10px] text-text-light-muted dark:text-text-dark-muted">
                    Current weight
                  </Text>
                </View>
              </View>
              
              <View className="mt-3">
                <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          (((currentWeight ?? 0) - connectedBottle.emptyWeightG) /
                            (connectedBottle.fullWeightG - connectedBottle.emptyWeightG)) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </View>
                <Text className="text-[10px] text-text-light-muted dark:text-text-dark-muted mt-1">
                  Auto-detection active - drinks are logged automatically
                </Text>
              </View>
            </View>
          </View>
        )}

        
        <View className="px-6 pb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
              My Bottles
            </Text>
            <TouchableOpacity onPress={() => router.push("/bottle/add")}>
              <View className="flex-row items-center">
                <Ionicons name="add-circle-outline" size={20} color="#0EA5E9" />
                <Text className="text-primary-500 ml-1">Add</Text>
              </View>
            </TouchableOpacity>
          </View>

          {bottles && bottles.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-2"
            >
              {bottles.map((bottle) => (
                <BottleCard
                  key={bottle._id}
                  bottle={bottle}
                  isConnected={isConnected && bottle.bleDeviceId === connectedDeviceId}
                  currentWeight={currentWeight}
                  onPress={() => router.push(`/bottle/${bottle._id}`)}
                />
              ))}
            </ScrollView>
          ) : (
            <TouchableOpacity
              className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 items-center border-2 border-dashed border-gray-200 dark:border-gray-700"
              onPress={() => router.push("/bottle/add")}
            >
              <Ionicons name="water-outline" size={40} color="#94A3B8" />
              <Text className="text-text-light-secondary dark:text-text-dark-secondary mt-2 text-center">
                Add your first smart bottle{"\n"}to start tracking
              </Text>
            </TouchableOpacity>
          )}
        </View>

        
        <View className="px-6 pb-4">
          <Text className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
            Today's Summary
          </Text>
          <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4">
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-primary-500">
                  {todayStats?.drinkCount || 0}
                </Text>
                <Text className="text-xs text-text-light-muted dark:text-text-dark-muted mt-1">
                  Drinks
                </Text>
              </View>
              <View className="w-px bg-gray-200 dark:bg-gray-700" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-secondary-500">
                  {(totalMl / 1000).toFixed(1)}L
                </Text>
                <Text className="text-xs text-text-light-muted dark:text-text-dark-muted mt-1">
                  Total
                </Text>
              </View>
              <View className="w-px bg-gray-200 dark:bg-gray-700" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-success-500">
                  {percentage}%
                </Text>
                <Text className="text-xs text-text-light-muted dark:text-text-dark-muted mt-1">
                  Goal
                </Text>
              </View>
            </View>
          </View>
        </View>

        
        <View className="px-6 pb-8">
          <LevelProgress level={user.level} xp={user.xp} compact />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
