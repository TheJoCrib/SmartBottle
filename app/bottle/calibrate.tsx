import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../../stores/authStore";
import { useBottleStore } from "../../stores/bottleStore";
import { bluetoothService } from "../../services/bluetooth";
import { Ionicons } from "@expo/vector-icons";

type CalibrationStep = "empty" | "full" | "done";

export default function CalibrateBottle() {
  const { token } = useAuthStore();
  const { currentWeight, isConnected } = useBottleStore();
  const updateBottle = useMutation(api.bottles.update);

  const [step, setStep] = useState<CalibrationStep>("empty");
  const [emptyWeight, setEmptyWeight] = useState<number | null>(null);
  const [fullWeight, setFullWeight] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const bottles = useQuery(api.bottles.list, token ? { token } : "skip");
  const latestBottle = bottles?.[bottles.length - 1];

  useEffect(() => {
    if (isConnected) {
      bluetoothService.subscribeToWeight((weight) => {
      });
    }
  }, [isConnected]);

  const handleConnect = async () => {
    if (!latestBottle?.bleDeviceId) {
      Alert.alert("Error", "No Bluetooth device associated with this bottle");
      return;
    }

    setIsConnecting(true);
    try {
      await bluetoothService.connect(latestBottle.bleDeviceId);
      await bluetoothService.subscribeToWeight(() => {});
    } catch (error: any) {
      Alert.alert("Connection Error", error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCaptureEmpty = () => {
    if (currentWeight === null) {
      Alert.alert("Error", "No weight reading available");
      return;
    }
    setEmptyWeight(currentWeight);
    setStep("full");
  };

  const handleCaptureFull = () => {
    if (currentWeight === null) {
      Alert.alert("Error", "No weight reading available");
      return;
    }
    setFullWeight(currentWeight);
    setStep("done");
  };

  const handleSave = async () => {
    if (!token || !latestBottle || emptyWeight === null || fullWeight === null) {
      Alert.alert("Error", "Calibration data incomplete");
      return;
    }

    try {
      await updateBottle({
        token,
        bottleId: latestBottle._id as any,
        emptyWeightG: emptyWeight,
        fullWeightG: fullWeight,
      });
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save calibration");
    }
  };

  const renderStep = () => {
    switch (step) {
      case "empty":
        return (
          <>
            <View className="w-32 h-32 bg-primary-100 dark:bg-primary-900/30 rounded-full items-center justify-center mb-6">
              <Text className="text-6xl">🫙</Text>
            </View>
            <Text className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary text-center">
              Empty Bottle
            </Text>
            <Text className="text-text-light-secondary dark:text-text-dark-secondary text-center mt-2 px-8">
              Place your empty bottle on the scale and make sure it's stable.
            </Text>

            {isConnected && currentWeight !== null && (
              <View className="mt-6 bg-surface-light dark:bg-surface-dark rounded-2xl p-6 items-center">
                <Text className="text-sm text-text-light-muted dark:text-text-dark-muted">
                  Current Reading
                </Text>
                <Text className="text-4xl font-bold text-primary-500 mt-2">
                  {currentWeight}g
                </Text>
              </View>
            )}

            <TouchableOpacity
              className={`mt-8 bg-primary-500 rounded-xl py-4 px-8 ${
                !isConnected || currentWeight === null ? "opacity-50" : ""
              }`}
              onPress={handleCaptureEmpty}
              disabled={!isConnected || currentWeight === null}
            >
              <Text className="text-white font-semibold text-lg">
                Capture Empty Weight
              </Text>
            </TouchableOpacity>
          </>
        );

      case "full":
        return (
          <>
            <View className="w-32 h-32 bg-primary-100 dark:bg-primary-900/30 rounded-full items-center justify-center mb-6">
              <Text className="text-6xl">🍶</Text>
            </View>
            <Text className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary text-center">
              Full Bottle
            </Text>
            <Text className="text-text-light-secondary dark:text-text-dark-secondary text-center mt-2 px-8">
              Now fill your bottle completely and place it on the scale.
            </Text>

            <View className="mt-4 bg-success-50 dark:bg-success-900/30 rounded-xl p-3">
              <Text className="text-success-700 dark:text-success-300 text-center text-sm">
                Empty weight captured: {emptyWeight}g
              </Text>
            </View>

            {isConnected && currentWeight !== null && (
              <View className="mt-6 bg-surface-light dark:bg-surface-dark rounded-2xl p-6 items-center">
                <Text className="text-sm text-text-light-muted dark:text-text-dark-muted">
                  Current Reading
                </Text>
                <Text className="text-4xl font-bold text-primary-500 mt-2">
                  {currentWeight}g
                </Text>
              </View>
            )}

            <TouchableOpacity
              className={`mt-8 bg-primary-500 rounded-xl py-4 px-8 ${
                !isConnected || currentWeight === null ? "opacity-50" : ""
              }`}
              onPress={handleCaptureFull}
              disabled={!isConnected || currentWeight === null}
            >
              <Text className="text-white font-semibold text-lg">
                Capture Full Weight
              </Text>
            </TouchableOpacity>
          </>
        );

      case "done":
        const waterWeight = (fullWeight || 0) - (emptyWeight || 0);
        return (
          <>
            <View className="w-32 h-32 bg-success-100 dark:bg-success-900/30 rounded-full items-center justify-center mb-6">
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            </View>
            <Text className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary text-center">
              Calibration Complete!
            </Text>
            <Text className="text-text-light-secondary dark:text-text-dark-secondary text-center mt-2 px-8">
              Your bottle is now calibrated and ready to use.
            </Text>

            <View className="mt-6 bg-surface-light dark:bg-surface-dark rounded-2xl p-4 w-full">
              <View className="flex-row justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <Text className="text-text-light-muted dark:text-text-dark-muted">
                  Empty Weight
                </Text>
                <Text className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                  {emptyWeight}g
                </Text>
              </View>
              <View className="flex-row justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <Text className="text-text-light-muted dark:text-text-dark-muted">
                  Full Weight
                </Text>
                <Text className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                  {fullWeight}g
                </Text>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="text-text-light-muted dark:text-text-dark-muted">
                  Water Capacity
                </Text>
                <Text className="font-semibold text-primary-500">
                  ~{waterWeight}ml
                </Text>
              </View>
            </View>

            <TouchableOpacity
              className="mt-8 bg-primary-500 rounded-xl py-4 px-8"
              onPress={handleSave}
            >
              <Text className="text-white font-semibold text-lg">
                Save & Start Tracking
              </Text>
            </TouchableOpacity>
          </>
        );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["bottom"]}>
      <View className="flex-1 px-6 items-center justify-center">
        {!isConnected ? (
          <>
            <View className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center mb-6">
              <Ionicons name="bluetooth-outline" size={64} color="#94A3B8" />
            </View>
            <Text className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary text-center">
              Connect Your Bottle
            </Text>
            <Text className="text-text-light-secondary dark:text-text-dark-secondary text-center mt-2 px-8">
              Connect to your SmartBottle via Bluetooth to start calibration.
            </Text>
            <TouchableOpacity
              className={`mt-8 bg-primary-500 rounded-xl py-4 px-8 flex-row items-center ${
                isConnecting ? "opacity-50" : ""
              }`}
              onPress={handleConnect}
              disabled={isConnecting}
            >
              <Ionicons name="bluetooth" size={20} color="white" />
              <Text className="text-white font-semibold text-lg ml-2">
                {isConnecting ? "Connecting..." : "Connect"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          renderStep()
        )}
      </View>
    </SafeAreaView>
  );
}
