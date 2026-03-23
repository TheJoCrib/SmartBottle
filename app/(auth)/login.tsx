import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../../stores/authStore";
import { Ionicons } from "@expo/vector-icons";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const login = useMutation(api.auth.login);
  const seedBeverages = useMutation(api.beverages.seedDefaults);
  const { setToken } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing Fields", "Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await login({ email: email.trim(), password });
      await setToken(result.token);

      try {
        await seedBeverages({});
      } catch {
      }

      router.replace("/");
    } catch (error: any) {
      const msg = error.message || "";
      if (msg.includes("Invalid email or password")) {
        Alert.alert("Login Failed", "The email or password you entered is incorrect. Please try again.");
      } else if (msg.includes("network") || msg.includes("fetch")) {
        Alert.alert("Connection Error", "Unable to reach the server. Please check your internet connection.");
      } else {
        Alert.alert("Login Failed", msg || "Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 pt-12">
            
            <View className="items-center mb-12">
              <View className="w-20 h-20 bg-primary-500 rounded-full items-center justify-center mb-4">
                <Text className="text-4xl">💧</Text>
              </View>
              <Text className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
                SmartBottle
              </Text>
              <Text className="text-base text-text-light-secondary dark:text-text-dark-secondary mt-2">
                Track your hydration journey
              </Text>
            </View>

            
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                  Email
                </Text>
                <TextInput
                  className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-text-light-primary dark:text-text-dark-primary"
                  placeholder="Enter your email"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View className="mt-4">
                <Text className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                  Password
                </Text>
                <View className="relative">
                  <TextInput
                    className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 pr-12 text-text-light-primary dark:text-text-dark-primary"
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                  />
                  <TouchableOpacity
                    className="absolute right-4 top-4"
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={24}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                className={`mt-6 bg-primary-500 rounded-xl py-4 items-center ${
                  isLoading ? "opacity-50" : ""
                }`}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text className="text-white font-semibold text-lg">
                  {isLoading ? "Signing in..." : "Sign In"}
                </Text>
              </TouchableOpacity>
            </View>

            
            <View className="flex-row justify-center mt-8">
              <Text className="text-text-light-secondary dark:text-text-dark-secondary">
                Don't have an account?{" "}
              </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text className="text-primary-500 font-semibold">
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
