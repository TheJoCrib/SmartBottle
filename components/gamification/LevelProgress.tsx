import { View, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";
import { useEffect } from "react";
import { xpProgress, xpForNextLevel, formatXP } from "../../utils/formatting";

interface LevelProgressProps {
  level: number;
  xp: number;
  compact?: boolean;
}

export function LevelProgress({ level, xp, compact = false }: LevelProgressProps) {
  const progressWidth = useSharedValue(0);
  const progress = xpProgress(xp);
  const remaining = xpForNextLevel(xp);

  useEffect(() => {
    progressWidth.value = withTiming(progress * 100, { duration: 800 });
  }, [xp]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  if (compact) {
    return (
      <View className="flex-row items-center">
        <View className="bg-primary-100 dark:bg-primary-900 px-2.5 py-1 rounded-full mr-2">
          <Text className="text-xs font-bold text-primary-500">Lv.{level}</Text>
        </View>
        <View className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <Animated.View
            className="h-full bg-primary-500 rounded-full"
            style={animatedBarStyle}
          />
        </View>
        <Text className="text-[10px] text-text-light-muted dark:text-text-dark-muted ml-2">
          {formatXP(xp)}
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View className="bg-primary-100 dark:bg-primary-900 w-12 h-12 rounded-full items-center justify-center mr-3">
            <Text className="text-lg font-bold text-primary-500">{level}</Text>
          </View>
          <View>
            <Text className="font-semibold text-text-light-primary dark:text-text-dark-primary">
              Level {level}
            </Text>
            <Text className="text-xs text-text-light-muted dark:text-text-dark-muted">
              {formatXP(xp)} total
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
            Next level
          </Text>
          <Text className="text-xs font-semibold text-primary-500">
            {remaining} XP
          </Text>
        </View>
      </View>

      
      <View className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <Animated.View
          className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full bg-primary-500"
          style={animatedBarStyle}
        />
      </View>

      
      <Text className="text-[10px] text-text-light-muted dark:text-text-dark-muted mt-1.5 text-right">
        {Math.round(progress * 100)}% to Level {level + 1}
      </Text>
    </View>
  );
}
