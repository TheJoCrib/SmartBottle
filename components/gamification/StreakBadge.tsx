import { View, Text } from "react-native";
import { formatStreak } from "../../utils/formatting";

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak: number;
  compact?: boolean;
}

function getStreakEmoji(streak: number): string {
  if (streak >= 365) return "🏆";
  if (streak >= 100) return "💎";
  if (streak >= 30) return "⭐";
  if (streak >= 7) return "🔥";
  if (streak >= 1) return "✨";
  return "💧";
}

function getStreakColor(streak: number): string {
  if (streak >= 30) return "bg-warning-100 dark:bg-warning-900";
  if (streak >= 7) return "bg-orange-100 dark:bg-orange-900";
  if (streak >= 1) return "bg-primary-100 dark:bg-primary-900";
  return "bg-gray-100 dark:bg-gray-800";
}

function getStreakTextColor(streak: number): string {
  if (streak >= 30) return "text-warning-600 dark:text-warning-400";
  if (streak >= 7) return "text-orange-600 dark:text-orange-400";
  if (streak >= 1) return "text-primary-600 dark:text-primary-400";
  return "text-text-light-muted dark:text-text-dark-muted";
}

export function StreakBadge({
  currentStreak,
  longestStreak,
  compact = false,
}: StreakBadgeProps) {
  const emoji = getStreakEmoji(currentStreak);

  if (compact) {
    return (
      <View className={`flex-row items-center px-3 py-1.5 rounded-full ${getStreakColor(currentStreak)}`}>
        <Text className="text-base mr-1">{emoji}</Text>
        <Text className={`font-bold text-sm ${getStreakTextColor(currentStreak)}`}>
          {currentStreak}
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4">
      <View className="flex-row items-center">
        
        <View className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 ${getStreakColor(currentStreak)}`}>
          <Text className="text-2xl">{emoji}</Text>
        </View>

        
        <View className="flex-1">
          <Text className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            {formatStreak(currentStreak)}
          </Text>
          <Text className="text-xs text-text-light-muted dark:text-text-dark-muted">
            Current Streak
          </Text>
        </View>

        
        <View className="items-end">
          <Text className="text-lg font-semibold text-text-light-secondary dark:text-text-dark-secondary">
            {longestStreak}
          </Text>
          <Text className="text-[10px] text-text-light-muted dark:text-text-dark-muted">
            Best
          </Text>
        </View>
      </View>

      
      {currentStreak > 0 && (
        <View className="flex-row mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          {[7, 30, 100, 365].map((milestone) => (
            <View key={milestone} className="flex-1 items-center">
              <Text
                className={`text-base ${
                  currentStreak >= milestone ? "" : "opacity-30"
                }`}
              >
                {getStreakEmoji(milestone)}
              </Text>
              <Text
                className={`text-[10px] mt-0.5 ${
                  currentStreak >= milestone
                    ? "text-text-light-primary dark:text-text-dark-primary font-medium"
                    : "text-text-light-muted dark:text-text-dark-muted"
                }`}
              >
                {milestone}d
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
