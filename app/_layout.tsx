import "../global.css";
import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useAuthStore } from "../stores/authStore";
import { useHydrationStore } from "../stores/hydrationStore";
import { useDemoStore } from "../stores/demoStore";
import { offlineService } from "../services/offline";
import { colors } from "../constants/theme";

SplashScreen.preventAutoHideAsync();

const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL || "https://your-deployment.convex.cloud"
);

const headerStyle = { backgroundColor: colors.background };

export default function RootLayout() {
  const { loadToken, isLoading: authLoading } = useAuthStore();
  const hydrationStore = useHydrationStore();
  const demoStore = useDemoStore();

  useEffect(() => {
    offlineService.init(convex);
    void loadToken();
    void hydrationStore.loadState();
    return () => offlineService.cleanup();
  }, []);

  useEffect(() => {
    if (hydrationStore.isLoaded && hydrationStore.demoMode) {
      const cap = Math.round(hydrationStore.dailyGoalMl * 0.4 / 50) * 50 || 1000;
      const emptyW = hydrationStore.emptyWeightG > 0 ? hydrationStore.emptyWeightG : 200;
      const fullW = hydrationStore.fullWeightG > 0 ? hydrationStore.fullWeightG : emptyW + cap;
      demoStore.startSimulation(fullW, emptyW);
    }
  }, [hydrationStore.isLoaded]);

  useEffect(() => {
    if (!authLoading && hydrationStore.isLoaded) {
      SplashScreen.hideAsync();
    }
  }, [authLoading, hydrationStore.isLoaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ConvexProvider client={convex}>
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
                contentStyle: { backgroundColor: colors.background },
                headerStyle,
                headerTintColor: colors.textPrimary,
                headerShadowVisible: false,
                headerBackTitle: "Tillbaka",
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="intro" options={{ headerShown: false, animation: "fade" }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen
                name="bottle/[id]"
                options={{
                  headerShown: true,
                  title: "Flaskdetaljer",
                  headerBackTitle: "Tillbaka",
                  presentation: "card",
                }}
              />
              <Stack.Screen
                name="bottle/add"
                options={{
                  headerShown: true,
                  title: "Lägg till flaska",
                  presentation: "modal",
                  headerLeft: () => null,
                  headerRight: () => (
                    <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")} hitSlop={12}>
                      <Text style={{ color: colors.accent, fontSize: 17, fontWeight: "600" }}>Stäng</Text>
                    </TouchableOpacity>
                  ),
                }}
              />
              <Stack.Screen
                name="bottle/calibrate"
                options={{
                  headerShown: true,
                  title: "Kalibrera flaska",
                  presentation: "fullScreenModal",
                  headerLeft: () => null,
                  headerRight: () => (
                    <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")} hitSlop={12}>
                      <Text style={{ color: colors.accent, fontSize: 17, fontWeight: "600" }}>Stäng</Text>
                    </TouchableOpacity>
                  ),
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
