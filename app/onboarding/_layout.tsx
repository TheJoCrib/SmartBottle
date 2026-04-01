import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Stack, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { colors } from "../../constants/theme";

const PROGRESS_ROUTES = ["profile", "activity", "conditions", "goal"];
const ALL_ROUTES = ["profile", "activity", "conditions", "goal", "first-bottle"];

export default function OnboardingLayout() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const progressAnim = useSharedValue(0.2);

  const currentSegment = pathname.split("/").pop() || "profile";
  const currentIndex = PROGRESS_ROUTES.indexOf(currentSegment);
  const progress = currentSegment === "first-bottle"
    ? 1
    : currentIndex >= 0
      ? (currentIndex + 1) / PROGRESS_ROUTES.length
      : 0.25;

  useEffect(() => {
    progressAnim.value = withTiming(progress, {
      duration: 400,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, fillStyle]} />
      </View>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="profile" />
        <Stack.Screen name="activity" />
        <Stack.Screen name="conditions" />
        <Stack.Screen name="goal" />
        <Stack.Screen name="first-bottle" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressTrack: {
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.accent,
    borderRadius: 1.5,
  },
});
