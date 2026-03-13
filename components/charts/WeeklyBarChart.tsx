import { View, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  withDelay,
} from "react-native-reanimated";
import { useEffect } from "react";

interface DayData {
  date: string;
  dayName: string;
  totalMl: number;
  goalMl: number;
  percentage: number;
}

interface WeeklyBarChartProps {
  data: DayData[];
  height?: number;
}

function Bar({
  day,
  index,
  maxHeight,
}: {
  day: DayData;
  index: number;
  maxHeight: number;
}) {
  const barHeight = useSharedValue(0);
  const isToday =
    index === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);

  useEffect(() => {
    const targetHeight = Math.max(8, (Math.min(day.percentage, 120) / 120) * maxHeight);
    barHeight.value = withDelay(index * 80, withTiming(targetHeight, { duration: 600 }));
  }, [day.percentage]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: barHeight.value,
  }));

  const barColor =
    day.percentage >= 100
      ? "bg-success-500"
      : isToday
        ? "bg-primary-500"
        : "bg-primary-300 dark:bg-primary-700";

  return (
    <View className="items-center flex-1">
      
      <Text className="text-[10px] text-text-light-muted dark:text-text-dark-muted mb-1">
        {day.totalMl > 0 ? `${(day.totalMl / 1000).toFixed(1)}` : ""}
      </Text>
      
      <Animated.View
        className={`w-7 rounded-t-lg ${barColor}`}
        style={animatedStyle}
      />
      
      <Text
        className={`text-xs mt-2 ${
          isToday
            ? "font-bold text-primary-500"
            : "text-text-light-muted dark:text-text-dark-muted"
        }`}
      >
        {day.dayName}
      </Text>
      
      {day.percentage >= 100 && (
        <Text className="text-[10px] mt-0.5">✓</Text>
      )}
    </View>
  );
}

export function WeeklyBarChart({ data, height = 140 }: WeeklyBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <View className="h-32 items-center justify-center">
        <Text className="text-text-light-muted dark:text-text-dark-muted">
          No data this week
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4">
      
      <View className="relative" style={{ height: height + 40 }}>
        
        <View
          className="absolute left-0 right-0 border-t border-dashed border-success-300 dark:border-success-700"
          style={{ top: height + 20 - (100 / 120) * height }}
        >
          <Text className="absolute -top-3 right-0 text-[10px] text-success-500">
            Goal
          </Text>
        </View>

        
        <View className="flex-row justify-between items-end" style={{ height: height + 20, paddingTop: 20 }}>
          {data.map((day, index) => (
            <Bar key={day.date} day={day} index={index} maxHeight={height} />
          ))}
        </View>
      </View>
    </View>
  );
}
