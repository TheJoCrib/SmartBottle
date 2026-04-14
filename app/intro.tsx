import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  withSpring,
  Easing,
  cancelAnimation,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, spacing } from "../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const INTRO_KEY = "hasSeenIntro";

function WaterOrbAnimation() {
  const floatY = useSharedValue(0);
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);
  const glowPulse = useSharedValue(0.85);
  const r1 = useSharedValue(0);
  const r1Op = useSharedValue(0);
  const r2 = useSharedValue(0);
  const r2Op = useSharedValue(0);
  const r3 = useSharedValue(0);
  const r3Op = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 700 });
    scale.value = withSpring(1, { damping: 12, stiffness: 80 });

    floatY.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
          withTiming(10, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );

    glowPulse.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1.08, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.88, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );

    const ripple = (p: typeof r1, o: typeof r1Op, d: number) => {
      p.value = withDelay(
        d,
        withRepeat(
          withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(1, { duration: 2400, easing: Easing.out(Easing.cubic) }),
          ),
          -1,
        ),
      );
      o.value = withDelay(
        d,
        withRepeat(
          withSequence(
            withTiming(0.3, { duration: 0 }),
            withTiming(0, { duration: 2400, easing: Easing.out(Easing.cubic) }),
          ),
          -1,
        ),
      );
    };
    ripple(r1, r1Op, 700);
    ripple(r2, r2Op, 1500);
    ripple(r3, r3Op, 2300);

    return () => {
      [floatY, scale, glowPulse, r1, r1Op, r2, r2Op, r3, r3Op].forEach(
        cancelAnimation,
      );
    };
  }, []);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));
  const dropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.5,
    transform: [{ scale: glowPulse.value }],
  }));
  const ring1Style = useAnimatedStyle(() => ({
    opacity: r1Op.value,
    transform: [{ scale: 1 + r1.value * 0.9 }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    opacity: r2Op.value,
    transform: [{ scale: 1 + r2.value * 0.9 }],
  }));
  const ring3Style = useAnimatedStyle(() => ({
    opacity: r3Op.value,
    transform: [{ scale: 1 + r3.value * 0.9 }],
  }));

  return (
    <Animated.View style={[anim.orbWrap, wrapStyle]}>
      <Animated.View style={[anim.glowOuter, glowStyle]} />
      <Animated.View style={[anim.glowInner, glowStyle]} />
      <Animated.View style={[anim.ring, ring1Style]} />
      <Animated.View style={[anim.ring, ring2Style]} />
      <Animated.View style={[anim.ring, ring3Style]} />
      <Animated.View style={dropStyle}>
        <View style={anim.iconCircle}>
          <Ionicons name="water" size={52} color={colors.accent} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function FeaturesAnimation() {
  const items = [
    {
      icon: "target" as const,
      label: "Dagliga mål",
      sub: "Personliga drickmål",
      color: colors.accent,
      bg: "rgba(56, 189, 248, 0.10)",
      delay: 200,
    },
    {
      icon: "bar-chart-2" as const,
      label: "Statistik",
      sub: "Följ din utveckling",
      color: colors.primaryLight,
      bg: "rgba(59, 130, 246, 0.10)",
      delay: 400,
    },
    {
      icon: "bell" as const,
      label: "Påminnelser",
      sub: "Aldrig glöm att dricka",
      color: "#A78BFA",
      bg: "rgba(167, 139, 250, 0.10)",
      delay: 600,
    },
  ];

  return (
    <View style={anim.featuresCol}>
      {items.map((item) => (
        <Animated.View
          key={item.icon}
          entering={FadeInDown.delay(item.delay)
            .duration(500)
            .springify()
            .damping(14)}
          style={anim.featureCard}
        >
          <View style={[anim.featureIcon, { backgroundColor: item.bg }]}>
            <Feather name={item.icon} size={22} color={item.color} />
          </View>
          <View style={anim.featureTextCol}>
            <Text style={anim.featureLabel}>{item.label}</Text>
            <Text style={anim.featureSub}>{item.sub}</Text>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

function FlowDiagramAnimation() {
  const steps = [
    {
      icon: (
        <MaterialCommunityIcons
          name="bottle-wine"
          size={24}
          color={colors.accent}
        />
      ),
      label: "Flaska",
      bg: "rgba(56, 189, 248, 0.12)",
      delay: 300,
    },
    {
      icon: (
        <MaterialCommunityIcons
          name="scale-balance"
          size={24}
          color={colors.primaryLight}
        />
      ),
      label: "Våg",
      bg: "rgba(96, 165, 250, 0.12)",
      delay: 600,
    },
    {
      icon: <Feather name="bluetooth" size={22} color="#A78BFA" />,
      label: "Bluetooth",
      bg: "rgba(167, 139, 250, 0.12)",
      delay: 900,
    },
    {
      icon: <Feather name="smartphone" size={22} color={colors.success} />,
      label: "App",
      bg: "rgba(74, 222, 128, 0.12)",
      delay: 1200,
    },
  ];

  return (
    <View style={anim.flowRow}>
      {steps.map((step, i) => (
        <View key={i} style={anim.flowStepWrap}>
          {i > 0 && (
            <Animated.View
              entering={FadeIn.delay(step.delay - 200).duration(400)}
              style={anim.flowConnector}
            />
          )}
          <Animated.View
            entering={FadeInDown.delay(step.delay)
              .duration(400)
              .springify()
              .damping(14)}
            style={anim.flowStepInner}
          >
            <View style={[anim.flowCircle, { backgroundColor: step.bg }]}>
              {step.icon}
            </View>
            <Text style={anim.flowLabel}>{step.label}</Text>
          </Animated.View>
        </View>
      ))}
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  const w = useSharedValue(active ? 24 : 8);

  useEffect(() => {
    w.value = withSpring(active ? 24 : 8, { damping: 15, stiffness: 150 });
  }, [active]);

  const animStyle = useAnimatedStyle(() => ({ width: w.value }));

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: active ? colors.accent : colors.elevated },
        animStyle,
      ]}
    />
  );
}

interface IntroPageData {
  id: string;
  title: string;
  body: string;
  Animation: React.FC;
}

const PAGES: IntroPageData[] = [
  {
    id: "welcome",
    title: "Välkommen till\nVätskebalans",
    body: "En smart vattenflaska som automatiskt spårar ditt vattenintag — så att du aldrig behöver tänka på det.",
    Animation: WaterOrbAnimation,
  },
  {
    id: "features",
    title: "Så här fungerar det",
    body: "Sätt dagliga mål, följ din statistik och få påminnelser — allt anpassat efter just dig.",
    Animation: FeaturesAnimation,
  },
  {
    id: "getstarted",
    title: "Kom igång",
    body: "Ställ din flaska på den smarta vågen. Bluetooth kopplar ihop allt. Du dricker — appen gör resten.",
    Animation: FlowDiagramAnimation,
  },
];

export default function IntroScreen() {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const finish = useCallback(async () => {
    await AsyncStorage.setItem(INTRO_KEY, "true");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace("/(auth)/login");
  }, []);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeIndex < PAGES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    } else {
      finish();
    }
  }, [activeIndex, finish]);

  const renderPage = useCallback(
    ({ item }: { item: IntroPageData }) => {
      const { Animation } = item;
      return (
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <View style={styles.animWrap}>
            <Animation />
          </View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
        </View>
      );
    },
    [],
  );

  const isLast = activeIndex === PAGES.length - 1;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <StatusBar style="light" />

      <View style={styles.header}>
        {!isLast && (
          <TouchableOpacity onPress={finish} activeOpacity={0.7} hitSlop={12}>
            <Text style={styles.skipText}>Hoppa över</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={PAGES}
        keyExtractor={(item) => item.id}
        renderItem={renderPage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {PAGES.map((_, i) => (
            <Dot key={i} active={i === activeIndex} />
          ))}
        </View>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>
            {isLast ? "Börja" : "Nästa"}
          </Text>
          <Feather
            name={isLast ? "check" : "arrow-right"}
            size={20}
            color="#FFF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const anim = StyleSheet.create({
  orbWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 240,
    height: 240,
  },
  glowOuter: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(56, 189, 248, 0.05)",
  },
  glowInner: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(56, 189, 248, 0.08)",
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.35)",
  },

  featuresCol: {
    gap: 12,
    width: SCREEN_WIDTH - 80,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTextCol: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  featureSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },

  flowRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  flowStepWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  flowStepInner: {
    alignItems: "center",
  },
  flowCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  flowLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    marginTop: 8,
    textAlign: "center",
  },
  flowConnector: {
    width: 18,
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.10)",
    borderRadius: 1,
    marginHorizontal: 6,
    marginTop: 27,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.page,
    paddingTop: 12,
    minHeight: 44,
  },
  skipText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textMuted,
  },
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  animWrap: {
    height: 260,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 34,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  footer: {
    paddingHorizontal: spacing.page,
    paddingBottom: 20,
    gap: 24,
    alignItems: "center",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
    width: "100%",
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
