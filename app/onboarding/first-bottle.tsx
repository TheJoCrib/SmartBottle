import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function FirstBottle() {
  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-1 px-6 justify-center items-center">
        
        <View className="w-32 h-32 bg-primary-100 dark:bg-primary-900/30 rounded-full items-center justify-center mb-8">
          <Text className="text-6xl">🍶</Text>
        </View>

        <Text className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary text-center">
          Add your first{"\n"}smart bottle
        </Text>

        <Text className="text-text-light-secondary dark:text-text-dark-secondary text-center mt-3 px-6">
          Connect your smart bottle via Bluetooth to start tracking your water
          intake automatically.
        </Text>

        
        <View className="w-full mt-8">
          <TouchableOpacity
            className="flex-row items-center bg-primary-500 rounded-xl py-4 px-5 mb-3"
            onPress={() => router.replace("/bottle/add")}
          >
            <Ionicons name="bluetooth" size={24} color="white" />
            <Text className="text-white font-semibold text-lg ml-3 flex-1">
              Connect Smart Bottle
            </Text>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center bg-surface-light dark:bg-surface-dark rounded-xl py-4 px-5 border border-gray-200 dark:border-gray-700"
            onPress={() => router.replace("/(tabs)")}
          >
            <Ionicons name="time-outline" size={24} color="#64748B" />
            <Text className="text-text-light-secondary dark:text-text-dark-secondary font-medium text-lg ml-3 flex-1">
              Skip for now
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        
        <View className="mt-8 bg-secondary-50 dark:bg-secondary-900/30 rounded-xl p-4">
          <View className="flex-row items-center">
            <Ionicons name="information-circle" size={20} color="#319795" />
            <Text className="text-secondary-700 dark:text-secondary-300 ml-2 flex-1 text-sm">
              You can also log drinks manually without a smart bottle
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
