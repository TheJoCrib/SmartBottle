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

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const register = useMutation(api.auth.register);
  const { setToken } = useAuthStore();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      const result = await register({ email, password, name });
      await setToken(result.token);
      router.replace("/onboarding/profile");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to register");
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
          <View className="flex-1 px-6 pt-8">
            
            <View className="items-center mb-8">
              <View className="w-16 h-16 bg-primary-500 rounded-full items-center justify-center mb-4">
                <Text className="text-3xl">💧</Text>
              </View>
              <Text className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                Create Account
              </Text>
              <Text className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
                Start your hydration journey today
              </Text>
            </View>

            
            <View className="space-y-3">
              <View>
                <Text className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                  Name
                </Text>
                <TextInput
                  className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-text-light-primary dark:text-text-dark-primary"
                  placeholder="Enter your name"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>

              <View className="mt-3">
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

              <View className="mt-3">
                <Text className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                  Password
                </Text>
                <View className="relative">
                  <TextInput
                    className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 pr-12 text-text-light-primary dark:text-text-dark-primary"
                    placeholder="Create a password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password-new"
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
                <Text className="text-xs text-text-light-muted dark:text-text-dark-muted mt-1">
                  Must be at least 8 characters
                </Text>
              </View>

              <View className="mt-3">
                <Text className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                  Confirm Password
                </Text>
                <TextInput
                  className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-text-light-primary dark:text-text-dark-primary"
                  placeholder="Confirm your password"
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
                />
              </View>

              <TouchableOpacity
                className={`mt-6 bg-primary-500 rounded-xl py-4 items-center ${
                  isLoading ? "opacity-50" : ""
                }`}
                onPress={handleRegister}
                disabled={isLoading}
              >
                <Text className="text-white font-semibold text-lg">
                  {isLoading ? "Creating account..." : "Create Account"}
                </Text>
              </TouchableOpacity>
            </View>

            
            <View className="flex-row justify-center mt-6">
              <Text className="text-text-light-secondary dark:text-text-dark-secondary">
                Already have an account?{" "}
              </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text className="text-primary-500 font-semibold">
                    Sign In
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
