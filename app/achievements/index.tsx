import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../../stores/authStore";
import { AchievementBadge } from "../../components/gamification/AchievementBadge";
import { formatRelativeTime } from "../../utils/formatting";

export default function Achievements() {
  const { token } = useAuthStore();
  const achievements = useQuery(
    api.achievements.list,
    token ? { token } : "skip"
  );

  const unlocked = achievements?.filter((a) => a.unlocked) || [];
  const locked = achievements?.filter((a) => !a.unlocked) || [];

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["bottom"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        <View className="px-6 pt-4 pb-6">
          <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-5 items-center">
            <Text className="text-4xl font-bold text-primary-500">
              {unlocked.length}/{achievements?.length || 0}
            </Text>
            <Text className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
              Achievements Unlocked
            </Text>
            
            <View className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full mt-4 overflow-hidden">
              <View
                className="h-full bg-warning-500 rounded-full"
                style={{
                  width: `${achievements?.length ? (unlocked.length / achievements.length) * 100 : 0}%`,
                }}
              />
            </View>
          </View>
        </View>

        
        {unlocked.length > 0 && (
          <View className="px-6 pb-4">
            <Text className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
              Unlocked
            </Text>
            {unlocked.map((achievement) => (
              <View
                key={achievement._id}
                className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 mb-3 flex-row items-center border-l-4 border-warning-500"
              >
                <View className="w-14 h-14 bg-warning-100 dark:bg-warning-900 rounded-xl items-center justify-center mr-4">
                  <Text className="text-2xl">{achievement.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                    {achievement.name}
                  </Text>
                  <Text className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
                    {achievement.description}
                  </Text>
                  <View className="flex-row items-center mt-1.5">
                    <Text className="text-[10px] text-warning-500 font-medium">
                      +{achievement.xpReward} XP
                    </Text>
                    {achievement.unlockedAt && (
                      <Text className="text-[10px] text-text-light-muted dark:text-text-dark-muted ml-2">
                        {formatRelativeTime(achievement.unlockedAt)}
                      </Text>
                    )}
                  </View>
                </View>
                <Text className="text-2xl">✅</Text>
              </View>
            ))}
          </View>
        )}

        
        {locked.length > 0 && (
          <View className="px-6 pb-8">
            <Text className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
              Locked
            </Text>
            {locked.map((achievement) => (
              <View
                key={achievement._id}
                className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 mb-3 flex-row items-center opacity-70"
              >
                <View className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-xl items-center justify-center mr-4">
                  <Text className="text-2xl opacity-40">{achievement.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                    {achievement.name}
                  </Text>
                  <Text className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
                    {achievement.description}
                  </Text>
                  <Text className="text-[10px] text-primary-500 font-medium mt-1.5">
                    Reward: +{achievement.xpReward} XP
                  </Text>
                </View>
                <Text className="text-2xl opacity-30">🔒</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
