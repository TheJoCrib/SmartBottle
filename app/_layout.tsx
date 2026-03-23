import "../global.css";
import { useEffect } from "react";
import { View, useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useAuthStore } from "../stores/authStore";
import { offlineService } from "../services/offline";
import { useOffline } from "../hooks/useOffline";
import { OfflineBanner } from "../components/ui/OfflineBanner";

SplashScreen.preventAutoHideAsync();

const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL || "https://your-deployment.convex.cloud"
);

offlineService.init(convex);

function OfflineBannerWrapper() {
  const { isOnline, pendingActions, isSyncing, syncNow } = useOffline();
  return (
    <OfflineBanner
      isOnline={isOnline}
      pendingActions={pendingActions}
      isSyncing={isSyncing}
      onSyncPress={syncNow}
    />
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { loadToken, isLoading } = useAuthStore();

  useEffect(() => {
    loadToken();
    return () => offlineService.cleanup();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  const headerStyle = {
    backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
  };
  const headerTintColor = isDark ? "#F8FAFC" : "#0F172A";

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ConvexProvider client={convex}>
          <View style={{ flex: 1 }}>
            <StatusBar style={isDark ? "light" : "dark"} />
            <OfflineBannerWrapper />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
                headerStyle,
                headerTintColor,
                headerBackTitle: "Back",
                headerShadowVisible: false,
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen
                name="bottle/[id]"
                options={{
                  headerShown: true,
                  title: "Bottle Details",
                  presentation: "card",
                }}
              />
              <Stack.Screen
                name="bottle/add"
                options={{
                  headerShown: true,
                  title: "Add Bottle",
                  presentation: "modal",
                }}
              />
              <Stack.Screen
                name="bottle/calibrate"
                options={{
                  headerShown: true,
                  title: "Calibrate Bottle",
                  presentation: "fullScreenModal",
                }}
              />
              <Stack.Screen
                name="drink/log"
                options={{
                  headerShown: true,
                  title: "Log Drink",
                  presentation: "modal",
                }}
              />
              <Stack.Screen
                name="achievements/index"
                options={{
                  headerShown: true,
                  title: "Achievements",
                  presentation: "card",
                }}
              />
              <Stack.Screen
                name="dev"
                options={{
                  headerShown: false,
                  presentation: "fullScreenModal",
                }}
              />
            </Stack>
          </View>
        </ConvexProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
