import { TouchableOpacity, Text, Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../../stores/authStore";
import { offlineService } from "../../services/offline";

interface QuickLogButtonProps {
  amount: number;
  icon: string;
  label: string;
}

export function QuickLogButton({ amount, icon, label }: QuickLogButtonProps) {
  const { token } = useAuthStore();
  const beverages = useQuery(api.beverages.list, token ? { token } : "skip");

  const handlePress = async () => {
    if (!token) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const waterBeverage = beverages?.find(
      (b) => b.isDefault && b.name === "Water"
    );

    if (!waterBeverage) {
      Alert.alert("Error", "Unable to log drink. Please try again.");
      return;
    }

    try {
      const result = await offlineService.executeOrQueue("log_drink", {
        token,
        beverageTypeId: waterBeverage._id,
        amountMl: amount,
        isManual: true,
      });

      if (result.executed) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Saved Offline", "Will sync when you're back online.");
      }
    } catch (error) {
      console.error("Error logging drink:", error);
      Alert.alert("Error", "Failed to log drink");
    }
  };

  return (
    <TouchableOpacity
      className="mx-2 items-center justify-center w-20 h-20 bg-primary-50 dark:bg-primary-900/30 rounded-2xl"
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text className="text-2xl">{icon}</Text>
      <Text className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-1">
        {label}
      </Text>
    </TouchableOpacity>
  );
}
