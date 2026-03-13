import { View, Text, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import { useEffect } from "react";

interface AchievementBadgeProps {
  icon: string;
  name: string;
  description: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: number;
  size?: "small" | "medium" | "large";
  onPress?: () => void;
}

export function AchievementBadge({
  icon,
  name,
  description,
  xpReward,
  unlocked,
  unlockedAt,
  size = "medium",
  onPress,
}: AchievementBadgeProps) {
  const scale = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 100 });
  }, [unlocked]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const sizeConfig = {
    small: { container: "w-14 h-14", icon: "text-xl", showDetails: false },
    medium: { container: "w-20 h-20", icon: "text-3xl", showDetails: true },
    large: { container: "w-28 h-28", icon: "text-5xl", showDetails: true },
  };

  const config = sizeConfig[size];

  if (size === "small") {
    return (
      <TouchableOpacity onPress={onPress} disabled={!onPress}>
        <Animated.View
          style={animatedStyle}
          className={`${config.container} rounded-xl items-center justify-center ${
            unlocked
              ? "bg-warning-100 dark:bg-warning-900"
              : "bg-gray-100 dark:bg-gray-800"
          }`}
        >
          <Text className={`${config.icon} ${!unlocked ? "opacity-30" : ""}`}>
            {icon}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} className="items-center">
      <Animated.View
        style={animatedStyle}
        className={`${config.container} rounded-2xl items-center justify-center mb-2 ${
          unlocked
            ? "bg-warning-100 dark:bg-warning-900 border-2 border-warning-300 dark:border-warning-700"
            : "bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700"
        }`}
      >
        <Text className={`${config.icon} ${!unlocked ? "opacity-30 grayscale" : ""}`}>
          {icon}
        </Text>
        {unlocked && (
          <View className="absolute -top-1 -right-1 bg-success-500 w-5 h-5 rounded-full items-center justify-center">
            <Text className="text-white text-[10px]">✓</Text>
          </View>
        )}
      </Animated.View>
      {config.showDetails && (
        <>
          <Text
            className={`text-xs font-semibold text-center ${
              unlocked
                ? "text-text-light-primary dark:text-text-dark-primary"
                : "text-text-light-muted dark:text-text-dark-muted"
            }`}
            numberOfLines={1}
          >
            {name}
          </Text>
          {unlocked ? (
            <Text className="text-[10px] text-warning-500 font-medium mt-0.5">
              +{xpReward} XP
            </Text>
          ) : (
            <Text className="text-[10px] text-text-light-muted dark:text-text-dark-muted mt-0.5">
              {description}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}
