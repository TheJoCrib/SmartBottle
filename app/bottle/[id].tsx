import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../../stores/authStore";
import { useBottleStore } from "../../stores/bottleStore";
import { bluetoothService } from "../../services/bluetooth";
import { Ionicons } from "@expo/vector-icons";
import { WaterProgressRing } from "../../components/ui/WaterProgressRing";

export default function BottleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuthStore();
  const { currentWeight, isConnected, connectedDeviceId } = useBottleStore();

  const bottle = useQuery(
    api.bottles.get,
    token && id ? { token, bottleId: id as any } : "skip"
  );
  const removeBottle = useMutation(api.bottles.remove);

  const handleConnect = async () => {
    if (!bottle?.bleDeviceId) {
      Alert.alert("Error", "No Bluetooth device associated with this bottle");
      return;
    }

    try {
      await bluetoothService.connect(bottle.bleDeviceId);
      await bluetoothService.subscribeToWeight(() => {});
    } catch (error: any) {
      Alert.alert("Connection Error", error.message);
    }
  };

  const handleDisconnect = async () => {
    try {
      await bluetoothService.disconnect();
    } catch (error: any) {
      console.error("Disconnect error:", error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Bottle",
      "Are you sure you want to delete this bottle?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!token || !id) return;
            try {
              await removeBottle({ token, bottleId: id as any });
              router.back();
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  if (!bottle) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark items-center justify-center">
        <Text className="text-text-light-muted">Loading...</Text>
      </SafeAreaView>
    );
  }

  const isThisBottleConnected =
    isConnected && connectedDeviceId === bottle.bleDeviceId;

  let waterLevel = 0;
  let currentMl = 0;
  if (isThisBottleConnected && currentWeight !== null) {
    const waterWeightG = currentWeight - bottle.emptyWeightG;
    const maxWaterWeightG = bottle.fullWeightG - bottle.emptyWeightG;
    currentMl = Math.max(0, Math.round(waterWeightG));
    waterLevel = Math.min(
      100,
      Math.max(0, (waterWeightG / maxWaterWeightG) * 100)
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["bottom"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        <View className="px-6 pt-4 items-center">
          <View
            className="w-24 h-24 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: bottle.color + "30" }}
          >
            <Text className="text-5xl">{bottle.icon}</Text>
          </View>
          <Text className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            {bottle.name}
          </Text>
          <Text className="text-text-light-secondary dark:text-text-dark-secondary">
            {bottle.capacityMl}ml capacity
          </Text>
        </View>

        
        {isThisBottleConnected && (
          <View className="px-6 py-6">
            <View className="bg-surface-light dark:bg-surface-dark rounded-3xl p-6 items-center">
              <WaterProgressRing
                percentage={Math.round(waterLevel)}
                currentMl={currentMl}
                goalMl={bottle.capacityMl}
                size={180}
              />
            </View>
          </View>
        )}

        
        <View className="px-6 pb-4">
          <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View
                  className={`w-3 h-3 rounded-full mr-3 ${
                    isThisBottleConnected ? "bg-success-500" : "bg-gray-300"
                  }`}
                />
                <View>
                  <Text className="font-medium text-text-light-primary dark:text-text-dark-primary">
                    {isThisBottleConnected ? "Connected" : "Disconnected"}
                  </Text>
                  {bottle.bleDeviceId && (
                    <Text className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      {bottle.bleDeviceId.substring(0, 17)}...
                    </Text>
                  )}
                </View>
              </View>

              {bottle.bleDeviceId && (
                <TouchableOpacity
                  className={`px-4 py-2 rounded-lg ${
                    isThisBottleConnected
                      ? "bg-gray-100 dark:bg-gray-800"
                      : "bg-primary-500"
                  }`}
                  onPress={isThisBottleConnected ? handleDisconnect : handleConnect}
                >
                  <Text
                    className={`font-medium ${
                      isThisBottleConnected
                        ? "text-text-light-secondary dark:text-text-dark-secondary"
                        : "text-white"
                    }`}
                  >
                    {isThisBottleConnected ? "Disconnect" : "Connect"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        
        <View className="px-6 pb-4">
          <Text className="text-sm font-semibold text-text-light-muted dark:text-text-dark-muted uppercase mb-2">
            Calibration Data
          </Text>
          <View className="bg-surface-light dark:bg-surface-dark rounded-2xl px-4">
            <View className="flex-row justify-between py-4 border-b border-gray-100 dark:border-gray-800">
              <Text className="text-text-light-secondary dark:text-text-dark-secondary">
                Empty Weight
              </Text>
              <Text className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                {bottle.emptyWeightG}g
              </Text>
            </View>
            <View className="flex-row justify-between py-4 border-b border-gray-100 dark:border-gray-800">
              <Text className="text-text-light-secondary dark:text-text-dark-secondary">
                Full Weight
              </Text>
              <Text className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                {bottle.fullWeightG}g
              </Text>
            </View>
            <View className="flex-row justify-between py-4">
              <Text className="text-text-light-secondary dark:text-text-dark-secondary">
                Water Weight
              </Text>
              <Text className="font-semibold text-primary-500">
                {bottle.fullWeightG - bottle.emptyWeightG}g
              </Text>
            </View>
          </View>
        </View>

        
        <View className="px-6 pb-8">
          <Text className="text-sm font-semibold text-text-light-muted dark:text-text-dark-muted uppercase mb-2">
            Actions
          </Text>
          <View className="bg-surface-light dark:bg-surface-dark rounded-2xl px-4">
            <TouchableOpacity
              className="flex-row items-center py-4 border-b border-gray-100 dark:border-gray-800"
              onPress={() => router.push("/bottle/calibrate")}
            >
              <Ionicons name="options-outline" size={20} color="#0EA5E9" />
              <Text className="flex-1 ml-3 text-text-light-primary dark:text-text-dark-primary">
                Recalibrate
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center py-4"
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text className="flex-1 ml-3 text-error-500">Delete Bottle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
