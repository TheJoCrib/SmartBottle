import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../stores/authStore";
import { useHydrationStore } from "../stores/hydrationStore";

const INTRO_KEY = "hasSeenIntro";

export default function Index() {
  const { token, isLoading: authLoading, isAuthenticated } = useAuthStore();
  const { isLoaded: hydrationLoaded } = useHydrationStore();

  const [introSeen, setIntroSeen] = useState<boolean | null>(null);

  const dropScale = useSharedValue(0.6);
  const dropOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(12);
  const subtitleOpacity = useSharedValue(0);

  useEffect(() => {
    (async () => {
      if (__DEV__) await AsyncStorage.removeItem(INTRO_KEY);
      const val = await AsyncStorage.getItem(INTRO_KEY);
      setIntroSeen(val === "true");
    })();

    dropOpacity.value = withTiming(1, { duration: 500 });
    dropScale.value = withSequence(
      withTiming(1.1, { duration: 400, easing: Easing.bezier(0.34, 1.56, 0.64, 1) }),
      withTiming(1, { duration: 200 })
    );
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    titleTranslateY.value = withDelay(
      300,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
    subtitleOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
  }, []);

  const dropStyle = useAnimatedStyle(() => ({
    opacity: dropOpacity.value,
    transform: [{ scale: dropScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  if (authLoading || !hydrationLoaded || introSeen === null) {
    return (
      <LinearGradient
        colors={["#0EA5E9", "#0284C7", "#0369A1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.splashContainer}
      >
        <StatusBar style="light" />
        <Animated.View style={dropStyle}>
          <Ionicons name="water" size={56} color="rgba(255,255,255,0.95)" />
        </Animated.View>
        <Animated.Text style={[styles.splashTitle, titleStyle]}>
          Vätskebalans
        </Animated.Text>
        <Animated.Text style={[styles.splashSubtitle, subtitleStyle]}>
          Din smarta flaska
        </Animated.Text>
      </LinearGradient>
    );
  }

  if (!introSeen) {
    return <Redirect href="/intro" />;
  }

  if (!isAuthenticated || !token) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  splashTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginTop: 16,
  },
  splashSubtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 6,
  },
});
