import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../../stores/authStore";
import { useOffline } from "../../hooks/useOffline";
import { Ionicons } from "@expo/vector-icons";

const QUICK_AMOUNTS = [100, 200, 250, 330, 500, 750, 1000];

export default function LogDrink() {
  const { token } = useAuthStore();
  const { logDrink, isOnline } = useOffline();
  const [selectedBeverage, setSelectedBeverage] = useState<string | null>(null);
  const [amount, setAmount] = useState("250");
  const [isLoading, setIsLoading] = useState(false);

  const beverages = useQuery(api.beverages.list, token ? { token } : "skip");

  const handleLog = async () => {
    if (!token || !selectedBeverage) {
      Alert.alert("Error", "Please select a beverage");
      return;
    }

    const amountMl = parseInt(amount);
    if (isNaN(amountMl) || amountMl <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await logDrink({
        token,
        beverageTypeId: selectedBeverage,
        amountMl,
        isManual: true,
      });

      if (!result.executed) {
        Alert.alert(
          "Saved Offline",
          "Your drink will be synced when you're back online.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to log drink");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["bottom"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        {!isOnline && (
          <View className="mx-6 mt-4 bg-warning-100 dark:bg-warning-900 rounded-xl px-4 py-3 flex-row items-center">
            <Ionicons name="cloud-offline" size={16} color="#F59E0B" />
            <Text className="text-warning-700 dark:text-warning-300 text-xs ml-2 flex-1">
              You're offline. Drinks will be synced when you reconnect.
            </Text>
          </View>
        )}

        
        <View className="px-6 pt-6 pb-4">
          <Text className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
            Amount (ml)
          </Text>
          <View className="flex-row items-center bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700">
            <TouchableOpacity
              className="p-4"
              onPress={() => {
                const current = parseInt(amount) || 0;
                if (current > 50) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAmount(String(current - 50));
                }
              }}
            >
              <Ionicons name="remove" size={24} color="#0EA5E9" />
            </TouchableOpacity>
            <TextInput
              className="flex-1 text-center text-3xl font-bold text-text-light-primary dark:text-text-dark-primary py-4"
              value={amount}
              onChangeText={setAmount}
              keyboardType="number-pad"
            />
            <TouchableOpacity
              className="p-4"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const current = parseInt(amount) || 0;
                setAmount(String(current + 50));
              }}
            >
              <Ionicons name="add" size={24} color="#0EA5E9" />
            </TouchableOpacity>
          </View>

          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3 -mx-2"
          >
            {QUICK_AMOUNTS.map((a) => (
              <TouchableOpacity
                key={a}
                className={`mx-1 px-4 py-2 rounded-full ${
                  amount === String(a)
                    ? "bg-primary-500"
                    : "bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700"
                }`}
                onPress={() => {
                  Haptics.selectionAsync();
                  setAmount(String(a));
                }}
              >
                <Text
                  className={`font-medium ${
                    amount === String(a)
                      ? "text-white"
                      : "text-text-light-secondary dark:text-text-dark-secondary"
                  }`}
                >
                  {a}ml
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        
        <View className="px-6 pb-6">
          <Text className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-3">
            Beverage Type
          </Text>
          <View className="flex-row flex-wrap -m-1">
            {beverages?.map((beverage) => (
              <TouchableOpacity
                key={beverage._id}
                className={`m-1 px-4 py-3 rounded-xl flex-row items-center ${
                  selectedBeverage === beverage._id
                    ? "bg-primary-500"
                    : "bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700"
                }`}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedBeverage(beverage._id);
                }}
              >
                <Text className="text-lg mr-2">{beverage.icon}</Text>
                <Text
                  className={`font-medium ${
                    selectedBeverage === beverage._id
                      ? "text-white"
                      : "text-text-light-primary dark:text-text-dark-primary"
                  }`}
                >
                  {beverage.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      
      <View className="px-6 pb-6">
        <TouchableOpacity
          className={`bg-primary-500 rounded-xl py-4 items-center ${
            isLoading || !selectedBeverage ? "opacity-50" : ""
          }`}
          onPress={handleLog}
          disabled={isLoading || !selectedBeverage}
        >
          <Text className="text-white font-semibold text-lg">
            {isLoading
              ? "Logging..."
              : !isOnline
                ? "Save Offline"
                : "Log Drink"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
