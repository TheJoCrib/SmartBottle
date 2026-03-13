import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../../stores/authStore";
import { bluetoothService, Device } from "../../services/bluetooth";
import { Ionicons } from "@expo/vector-icons";

const BOTTLE_ICONS = ["🍶", "🫗", "🧴", "🥤", "🍼", "🏺", "🪣", "💧"];
const BOTTLE_COLORS = [
  "#0EA5E9",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#64748B",
];
const PRESET_CAPACITIES = [250, 350, 500, 750, 1000, 1500, 2000];

export default function AddBottle() {
  const { token } = useAuthStore();
  const createBottle = useMutation(api.bottles.create);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState(BOTTLE_ICONS[0]);
  const [color, setColor] = useState(BOTTLE_COLORS[0]);
  const [capacity, setCapacity] = useState("500");
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    setDevices([]);

    try {
      await bluetoothService.scanForDevices((device) => {
        setDevices((prev) => {
          if (prev.find((d) => d.id === device.id)) return prev;
          return [...prev, device];
        });
      }, 10000);
    } catch (error: any) {
      Alert.alert("Scan Error", error.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleStopScan = () => {
    bluetoothService.stopScan();
    setIsScanning(false);
  };

  const handleCreate = async () => {
    if (!token || !name) {
      Alert.alert("Error", "Please enter a bottle name");
      return;
    }

    const capacityMl = parseInt(capacity);
    if (isNaN(capacityMl) || capacityMl <= 0) {
      Alert.alert("Error", "Please enter a valid capacity");
      return;
    }

    setIsLoading(true);
    try {
      await createBottle({
        token,
        name,
        icon,
        color,
        capacityMl,
        emptyWeightG: 100,
        fullWeightG: 100 + capacityMl,
        bleDeviceId: selectedDevice?.id,
      });

      if (selectedDevice) {
        router.replace("/bottle/calibrate");
      } else {
        router.back();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create bottle");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["bottom"]}>
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        
        <View className="pt-4 pb-4">
          <Text className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
            Bottle Name
          </Text>
          <TextInput
            className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-text-light-primary dark:text-text-dark-primary"
            placeholder="My Water Bottle"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={setName}
          />
        </View>

        
        <View className="pb-4">
          <Text className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
            Icon
          </Text>
          <View className="flex-row flex-wrap -m-1">
            {BOTTLE_ICONS.map((i) => (
              <TouchableOpacity
                key={i}
                className={`m-1 w-12 h-12 rounded-xl items-center justify-center ${
                  icon === i
                    ? "bg-primary-100 dark:bg-primary-900 border-2 border-primary-500"
                    : "bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700"
                }`}
                onPress={() => setIcon(i)}
              >
                <Text className="text-2xl">{i}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        
        <View className="pb-4">
          <Text className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
            Color
          </Text>
          <View className="flex-row flex-wrap -m-1">
            {BOTTLE_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                className={`m-1 w-10 h-10 rounded-full items-center justify-center ${
                  color === c ? "border-2 border-gray-900 dark:border-white" : ""
                }`}
                style={{ backgroundColor: c }}
                onPress={() => setColor(c)}
              >
                {color === c && (
                  <Ionicons name="checkmark" size={20} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        
        <View className="pb-4">
          <Text className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
            Capacity (ml)
          </Text>
          <TextInput
            className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-text-light-primary dark:text-text-dark-primary mb-2"
            placeholder="500"
            placeholderTextColor="#94A3B8"
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="number-pad"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
            {PRESET_CAPACITIES.map((c) => (
              <TouchableOpacity
                key={c}
                className={`mx-1 px-4 py-2 rounded-full ${
                  capacity === String(c)
                    ? "bg-primary-500"
                    : "bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700"
                }`}
                onPress={() => setCapacity(String(c))}
              >
                <Text
                  className={`font-medium ${
                    capacity === String(c)
                      ? "text-white"
                      : "text-text-light-secondary dark:text-text-dark-secondary"
                  }`}
                >
                  {c >= 1000 ? `${c / 1000}L` : `${c}ml`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        
        <View className="pb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">
              Smart Bottle (Optional)
            </Text>
            <TouchableOpacity
              className="flex-row items-center"
              onPress={isScanning ? handleStopScan : handleScan}
            >
              {isScanning ? (
                <>
                  <ActivityIndicator size="small" color="#0EA5E9" />
                  <Text className="text-primary-500 ml-2">Stop</Text>
                </>
              ) : (
                <>
                  <Ionicons name="bluetooth" size={18} color="#0EA5E9" />
                  <Text className="text-primary-500 ml-1">Scan</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {selectedDevice ? (
            <TouchableOpacity
              className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-xl p-4 flex-row items-center"
              onPress={() => setSelectedDevice(null)}
            >
              <View className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full items-center justify-center">
                <Ionicons name="bluetooth" size={20} color="#0EA5E9" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="font-medium text-text-light-primary dark:text-text-dark-primary">
                  {selectedDevice.name || "SmartBottle"}
                </Text>
                <Text className="text-xs text-text-light-muted dark:text-text-dark-muted">
                  {selectedDevice.id}
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#0EA5E9" />
            </TouchableOpacity>
          ) : devices.length > 0 ? (
            <View className="bg-surface-light dark:bg-surface-dark rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              {devices.map((device, index) => (
                <TouchableOpacity
                  key={device.id}
                  className={`p-4 flex-row items-center ${
                    index < devices.length - 1 ? "border-b border-gray-100 dark:border-gray-800" : ""
                  }`}
                  onPress={() => setSelectedDevice(device)}
                >
                  <Ionicons name="bluetooth" size={20} color="#64748B" />
                  <View className="flex-1 ml-3">
                    <Text className="font-medium text-text-light-primary dark:text-text-dark-primary">
                      {device.name || "SmartBottle"}
                    </Text>
                    <Text className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      Signal: {device.rssi || "N/A"} dBm
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 items-center border border-gray-200 dark:border-gray-700">
              <Ionicons name="bluetooth-outline" size={32} color="#94A3B8" />
              <Text className="text-text-light-muted dark:text-text-dark-muted mt-2 text-center text-sm">
                Tap "Scan" to find your{"\n"}SmartBottle device
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      
      <View className="px-6 pb-6">
        <TouchableOpacity
          className={`bg-primary-500 rounded-xl py-4 items-center ${
            isLoading || !name ? "opacity-50" : ""
          }`}
          onPress={handleCreate}
          disabled={isLoading || !name}
        >
          <Text className="text-white font-semibold text-lg">
            {isLoading ? "Creating..." : "Create Bottle"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
