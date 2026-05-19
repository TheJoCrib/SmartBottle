import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors, spacing, typography } from "../../constants/theme";

export default function FirstBottle() {
  const insets = useSafeAreaInsets();

  const handleConnect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/bottle/add");
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(tabs)");
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.iconWrapper}
        >
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="bottle-wine"
              size={64}
              color={colors.accent}
            />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(250).duration(500)}
          style={styles.textBlock}
        >
          <Text style={styles.title}>Lägg till din första flaska</Text>
          <Text style={styles.description}>
            Anslut din smarta flaska via Bluetooth för att börja spåra ditt
            vätskeintag automatiskt.
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
          style={styles.actions}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleConnect}
            activeOpacity={0.8}
          >
            <Ionicons name="bluetooth" size={22} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Anslut smart flaska</Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipLink}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Hoppa över</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.page,
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapper: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    color: colors.textPrimary,
    textAlign: "center",
  },
  description: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  actions: {
    width: "100%",
    alignItems: "center",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: spacing.cardRadius,
    height: 52,
    paddingHorizontal: 20,
    width: "100%",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
    marginLeft: 12,
  },
  skipLink: {
    marginTop: 20,
    paddingVertical: 8,
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "500",
  },
});
