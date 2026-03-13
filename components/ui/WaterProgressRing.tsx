import { View, Text } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { useEffect } from "react";
import Animated, {
  useAnimatedProps,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface WaterProgressRingProps {
  percentage: number;
  currentMl: number;
  goalMl: number;
  size?: number;
}

export function WaterProgressRing({
  percentage,
  currentMl,
  goalMl,
  size = 200,
}: WaterProgressRingProps) {
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.min(percentage, 100) / 100, {
      duration: 1000,
    });
  }, [percentage]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View className="items-center justify-center">
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#0EA5E9" />
            <Stop offset="100%" stopColor="#38BDF8" />
          </LinearGradient>
        </Defs>

        
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      
      <View className="absolute items-center">
        <Text className="text-4xl">💧</Text>
        <Text className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary mt-2">
          {currentMl >= 1000
            ? `${(currentMl / 1000).toFixed(1)}L`
            : `${currentMl}ml`}
        </Text>
        <Text className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          of {goalMl >= 1000 ? `${(goalMl / 1000).toFixed(1)}L` : `${goalMl}ml`}
        </Text>
        <Text className="text-xl font-semibold text-primary-500 mt-1">
          {percentage}%
        </Text>
      </View>
    </View>
  );
}
