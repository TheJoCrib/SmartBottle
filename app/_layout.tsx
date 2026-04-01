import "../global.css";
import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useAuthStore } from "../stores/authStore";
import { useHydrationStore } from "../stores/hydrationStore";
import { offlineService } from "../services/offline";

SplashScreen.preventAutoHideAsync();

const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL || "https://your-deployment.convex.cloud"
);

export default function RootLayout() {
  const { loadToken, isLoading: authLoading } = useAuthStore();
  const { loadState, isLoaded: hydrationLoaded } = useHydrationStore();

  useEffect(() => {
    offlineService.init(convex);
    loadToken();
    loadState();
    return () => offlineService.cleanup();
  }, []);

  useEffect(() => {
    if (!authLoading && hydrationLoaded) {
      SplashScreen.hideAsync();
    }
  }, [authLoading, hydrationLoaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ConvexProvider client={convex}>
          <View style={{ flex: 1, backgroundColor: "#0C1425" }}>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
                contentStyle: { backgroundColor: "#0C1425" },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen
                name="(auth)"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(tabs)"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="onboarding"
                options={{ headerShown: false }}
              />
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
