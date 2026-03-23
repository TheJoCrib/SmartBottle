import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Bottle {
  _id: string;
  name: string;
  icon: string;
  color: string;
  capacityMl: number;
  emptyWeightG: number;
  fullWeightG: number;
  bleDeviceId?: string;
  isActive: boolean;
}

interface BottleCardProps {
  bottle: Bottle;
  isConnected: boolean;
  currentWeight: number | null;
  onPress: () => void;
}

export function BottleCard({
  bottle,
  isConnected,
  currentWeight,
  onPress,
}: BottleCardProps) {
  let waterLevel = 0;
  let currentMl = 0;

  if (isConnected && currentWeight !== null) {
    const waterWeightG = currentWeight - bottle.emptyWeightG;
    const maxWaterWeightG = bottle.fullWeightG - bottle.emptyWeightG;
    currentMl = Math.max(0, Math.round(waterWeightG));
    waterLevel = Math.min(100, Math.max(0, (waterWeightG / maxWaterWeightG) * 100));
  }

  return (
    <TouchableOpacity
      className="mx-2 w-36 bg-surface-light dark:bg-surface-dark rounded-2xl p-4 shadow-sm"
      onPress={onPress}
      activeOpacity={0.7}
    >
      
      <View className="flex-row items-center justify-between mb-2">
        <View
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-success-500" : "bg-gray-300 dark:bg-gray-600"
          }`}
        />
        {bottle.bleDeviceId && (
          <Ionicons
            name="bluetooth"
            size={14}
            color={isConnected ? "#10B981" : "#94A3B8"}
          />
        )}
      </View>

      
      <View
        className="w-14 h-14 rounded-xl items-center justify-center mb-3"
        style={{ backgroundColor: bottle.color + "20" }}
      >
        <Text className="text-2xl">{bottle.icon}</Text>
      </View>

      
      <Text
        className="font-semibold text-text-light-primary dark:text-text-dark-primary"
        numberOfLines={1}
      >
        {bottle.name}
      </Text>

      
      <Text className="text-xs text-text-light-muted dark:text-text-dark-muted mt-1">
        {isConnected
          ? `${currentMl}ml / ${bottle.capacityMl}ml`
          : `${bottle.capacityMl}ml`}
      </Text>

      
      {isConnected && (
        <View className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <View
            className="h-full bg-primary-500 rounded-full"
            style={{ width: `${waterLevel}%` }}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}
