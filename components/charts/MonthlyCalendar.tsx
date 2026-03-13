import { View, Text } from "react-native";

interface DayData {
  date: string;
  day: number;
  totalMl: number;
  goalMl: number;
  percentage: number;
}

interface MonthlyCalendarProps {
  data: DayData[];
  monthName: string;
  year: number;
}

function getColorForPercentage(percentage: number): string {
  if (percentage === 0) return "bg-gray-100 dark:bg-gray-800";
  if (percentage < 25) return "bg-primary-100 dark:bg-primary-900";
  if (percentage < 50) return "bg-primary-200 dark:bg-primary-800";
  if (percentage < 75) return "bg-primary-300 dark:bg-primary-700";
  if (percentage < 100) return "bg-primary-400 dark:bg-primary-600";
  return "bg-success-500";
}

function getTextColorForPercentage(percentage: number): string {
  if (percentage === 0) return "text-text-light-muted dark:text-text-dark-muted";
  if (percentage < 75) return "text-text-light-primary dark:text-text-dark-primary";
  return "text-white";
}

export function MonthlyCalendar({ data, monthName, year }: MonthlyCalendarProps) {
  if (!data || data.length === 0) {
    return (
      <View className="h-32 items-center justify-center">
        <Text className="text-text-light-muted dark:text-text-dark-muted">
          No data this month
        </Text>
      </View>
    );
  }

  const firstDayOfMonth = new Date(year, new Date(`${data[0]?.date}`).getMonth(), 1).getDay();

  const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date().getDate();
  const isCurrentMonth =
    new Date().getMonth() === new Date(`${data[0]?.date}`).getMonth() &&
    new Date().getFullYear() === year;

  const calendarCells: (DayData | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }
  data.forEach((day) => calendarCells.push(day));

  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  const daysGoalMet = data.filter((d) => d.percentage >= 100).length;
  const activeDays = data.filter((d) => d.totalMl > 0).length;
  const avgPercentage = activeDays > 0
    ? Math.round(data.reduce((sum, d) => sum + d.percentage, 0) / activeDays)
    : 0;

  return (
    <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4">
      
      <Text className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
        {monthName} {year}
      </Text>

      
      <View className="flex-row mb-2">
        {DAYS_OF_WEEK.map((day) => (
          <View key={day} className="flex-1 items-center">
            <Text className="text-[10px] font-medium text-text-light-muted dark:text-text-dark-muted">
              {day}
            </Text>
          </View>
        ))}
      </View>

      
      <View className="flex-row flex-wrap">
        {calendarCells.map((cell, index) => (
          <View key={index} className="w-[14.28%] aspect-square p-0.5">
            {cell ? (
              <View
                className={`flex-1 rounded-lg items-center justify-center ${getColorForPercentage(cell.percentage)} ${
                  isCurrentMonth && cell.day === today ? "border-2 border-primary-500" : ""
                }`}
              >
                <Text
                  className={`text-xs font-medium ${getTextColorForPercentage(cell.percentage)}`}
                >
                  {cell.day}
                </Text>
              </View>
            ) : (
              <View className="flex-1" />
            )}
          </View>
        ))}
      </View>

      
      <View className="flex-row items-center justify-center mt-3 space-x-1">
        <Text className="text-[10px] text-text-light-muted dark:text-text-dark-muted mr-1">
          Less
        </Text>
        {[0, 25, 50, 75, 100].map((pct) => (
          <View
            key={pct}
            className={`w-4 h-4 rounded ${getColorForPercentage(pct)}`}
          />
        ))}
        <Text className="text-[10px] text-text-light-muted dark:text-text-dark-muted ml-1">
          More
        </Text>
      </View>

      
      <View className="flex-row mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-success-500">{daysGoalMet}</Text>
          <Text className="text-[10px] text-text-light-muted dark:text-text-dark-muted">
            Goals Met
          </Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-primary-500">{activeDays}</Text>
          <Text className="text-[10px] text-text-light-muted dark:text-text-dark-muted">
            Active Days
          </Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-secondary-500">{avgPercentage}%</Text>
          <Text className="text-[10px] text-text-light-muted dark:text-text-dark-muted">
            Avg Goal %
          </Text>
        </View>
      </View>
    </View>
  );
}
