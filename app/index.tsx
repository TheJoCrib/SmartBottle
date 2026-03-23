import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuthStore } from "../stores/authStore";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export default function Index() {
  const { token, isLoading, isAuthenticated } = useAuthStore();

  const user = useQuery(
    api.auth.validateSession,
    token ? { token } : "skip"
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background-light dark:bg-background-dark">
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  if (!isAuthenticated || !token) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-background-light dark:bg-background-dark">
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  if (user === null) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!user.height || !user.weight) {
    return <Redirect href="/onboarding/profile" />;
  }

  return <Redirect href="/(tabs)" />;
}
