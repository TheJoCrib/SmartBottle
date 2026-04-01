import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  interpolate,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import Svg, {
  Path as SvgPath,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
} from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/theme";

interface BottleSkiaProps {
  fillPercentage: number;
  currentMl: number;
  bottleState: "on_scale" | "off_scale" | "disconnected";
  modelKey?: string;
  width?: number;
  height?: number;
}

interface ShapeConfig {
  widthRatio: number;
  heightRatio: number;
}

function getShapeConfig(modelKey: string): ShapeConfig {
  switch (modelKey) {
    case "coffeeMug":
      return { widthRatio: 0.48, heightRatio: 0.65 };
    case "thermos":
      return { widthRatio: 0.32, heightRatio: 1.0 };
    case "sportBottle":
      return { widthRatio: 0.38, heightRatio: 0.85 };
    case "glassBottle":
      return { widthRatio: 0.34, heightRatio: 0.95 };
    case "waterBottle":
    default:
      return { widthRatio: 0.36, heightRatio: 0.9 };
  }
}

export function BottleSkia({
  fillPercentage,
  currentMl,
  bottleState,
  modelKey = "waterBottle",
  width = 220,
  height = 320,
}: BottleSkiaProps) {
  const config = getShapeConfig(modelKey);
  const capsuleW = Math.round(width * config.widthRatio * 2);
  const capsuleH = Math.round(height * config.heightRatio);
  const borderRadius = capsuleW / 2;
  const padding = 4;
  const innerW = capsuleW - padding * 2;
  const innerH = capsuleH - padding * 2;

  const fillRatio = Math.min(1, Math.max(0, fillPercentage));
  const isOnScale = bottleState === "on_scale";
  const isOffScale = bottleState === "off_scale";
  const isDisconnected = bottleState === "disconnected";

  const waterLevel = useSharedValue(fillRatio);
  const wave1Phase = useSharedValue(0);
  const wave2Phase = useSharedValue(0);
  const wave3Phase = useSharedValue(0);
  const dropBounce = useSharedValue(0);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (!isDisconnected) {
      waterLevel.value = withSpring(fillRatio, {
        damping: 18,
        stiffness: 60,
        mass: 1,
      });
    }
  }, [fillRatio, isDisconnected]);

  useEffect(() => {
    wave1Phase.value = 0;
    wave2Phase.value = 0;
    wave3Phase.value = 0;

    wave1Phase.value = withRepeat(
      withTiming(1, { duration: 3500, easing: Easing.linear }),
      -1, false,
    );
    wave2Phase.value = withRepeat(
      withTiming(1, { duration: 5000, easing: Easing.linear }),
      -1, false,
    );
    wave3Phase.value = withRepeat(
      withTiming(1, { duration: 7000, easing: Easing.linear }),
      -1, false,
    );

    if (isOnScale) {
      dropBounce.value = withRepeat(
        withTiming(1, {
          duration: 2000,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
        }),
        -1,
        true,
      );
    } else {
      cancelAnimation(dropBounce);
      dropBounce.value = 0;
    }

    if (isOffScale) {
      pulseOpacity.value = withRepeat(
        withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulseOpacity);
      pulseOpacity.value = 1;
    }

    return () => {
      cancelAnimation(wave1Phase);
      cancelAnimation(wave2Phase);
      cancelAnimation(wave3Phase);
      cancelAnimation(dropBounce);
      cancelAnimation(pulseOpacity);
    };
  }, [bottleState]);

  const waterStyle = useAnimatedStyle(() => ({
    height: Math.max(0, waterLevel.value * innerH * 0.93),
  }));

  const wave1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: -wave1Phase.value * innerW }],
  }));

  const wave2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: -wave2Phase.value * innerW }],
  }));

  const wave3Style = useAnimatedStyle(() => ({
    transform: [{ translateX: -wave3Phase.value * innerW }],
  }));

  const dropStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(dropBounce.value, [0, 1], [-2, 3]) }],
  }));

  const bottlePulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const wave1Path = useMemo(() => generateWavePath(innerW, 8, 0), [innerW]);
  const wave2Path = useMemo(() => generateWavePath(innerW, 6, Math.PI * 0.6), [innerW]);
  const wave3Path = useMemo(() => generateWavePath(innerW, 5, Math.PI * 1.2), [innerW]);

  const waveAreaHeight = 26;

  const capsuleBorderColor = isDisconnected
    ? "rgba(255,255,255,0.08)"
    : "rgba(255,255,255,0.15)";
  const glassBgColor = isDisconnected
    ? "rgba(100,116,139,0.12)"
    : "rgba(255,255,255,0.05)";
  const containerOpacity = isDisconnected ? 0.3 : 1;

  return (
    <View style={styles.outerWrapper}>
      <Animated.View
        style={[
          styles.wrapper,
          { width, opacity: containerOpacity },
          !isDisconnected && bottlePulseStyle,
        ]}
      >
        
        <View
          style={[
            styles.capsuleOuter,
            {
              width: capsuleW,
              height: capsuleH,
              borderRadius,
              borderColor: capsuleBorderColor,
            },
          ]}
        >
          
          <View
            style={[
              styles.capsuleInner,
              {
                width: innerW,
                height: innerH,
                borderRadius: borderRadius - padding,
              },
            ]}
          >
            
            <View
              style={[
                styles.glassBg,
                {
                  borderRadius: borderRadius - padding,
                  backgroundColor: glassBgColor,
                },
              ]}
            />

            
            {!isDisconnected && (
              <Animated.View style={[styles.waterFill, waterStyle]}>
                
                <View style={styles.waveLayer}>
                  <Animated.View style={[styles.waveScroll, wave1Style]}>
                    <Svg
                      width={innerW * 2}
                      height={waveAreaHeight}
                      viewBox={`0 0 ${innerW * 2} ${waveAreaHeight}`}
                    >
                      <Defs>
                        <SvgLinearGradient
                          id="bsWg1"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <Stop
                            offset="0"
                            stopColor={colors.waterLight}
                            stopOpacity="0.9"
                          />
                          <Stop
                            offset="1"
                            stopColor={colors.waterMid}
                            stopOpacity="0.7"
                          />
                        </SvgLinearGradient>
                      </Defs>
                      <SvgPath d={wave1Path} fill="url(#bsWg1)" />
                    </Svg>
                  </Animated.View>
                </View>

                
                <View style={[styles.waveLayer, { top: 2 }]}>
                  <Animated.View style={[styles.waveScroll, wave2Style]}>
                    <Svg
                      width={innerW * 2}
                      height={waveAreaHeight}
                      viewBox={`0 0 ${innerW * 2} ${waveAreaHeight}`}
                    >
                      <SvgPath
                        d={wave2Path}
                        fill={colors.waterMid}
                        opacity={0.5}
                      />
                    </Svg>
                  </Animated.View>
                </View>

                
                <View style={[styles.waveLayer, { top: 4, zIndex: 0 }]}>
                  <Animated.View style={[styles.waveScroll, wave3Style]}>
                    <Svg
                      width={innerW * 2}
                      height={waveAreaHeight}
                      viewBox={`0 0 ${innerW * 2} ${waveAreaHeight}`}
                    >
                      <SvgPath
                        d={wave3Path}
                        fill={colors.waterDark}
                        opacity={0.4}
                      />
                    </Svg>
                  </Animated.View>
                </View>

                
                <View style={styles.waterBody}>
                  <Svg
                    width={innerW}
                    height={innerH}
                    preserveAspectRatio="none"
                  >
                    <Defs>
                      <SvgLinearGradient
                        id="bsWaterGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <Stop offset="0" stopColor={colors.waterMid} />
                        <Stop offset="0.5" stopColor="#0EA5E9" />
                        <Stop offset="1" stopColor={colors.waterDark} />
                      </SvgLinearGradient>
                    </Defs>
                    <Rect
                      x="0"
                      y="0"
                      width={innerW}
                      height={innerH}
                      fill="url(#bsWaterGrad)"
                    />
                  </Svg>
                </View>
              </Animated.View>
            )}

            
            <View
              style={[styles.glassReflection, { height: capsuleH * 0.6 }]}
            />
          </View>
        </View>

        
        <View
          style={[styles.textOverlay, { width: capsuleW, height: capsuleH }]}
        >
          <View style={styles.textBackdrop} />

          
          {!isDisconnected && (
            <Animated.View style={[styles.dropContainer, dropStyle]}>
              <Ionicons name="water" size={26} color="rgba(255,255,255,0.85)" />
            </Animated.View>
          )}

          
          {isDisconnected && (
            <View style={styles.dropContainer}>
              <Ionicons
                name="cloud-offline-outline"
                size={28}
                color="rgba(255,255,255,0.4)"
              />
            </View>
          )}

          
          <Text style={[styles.mlNumber, isDisconnected && styles.mlNumberDim]}>
            {isDisconnected ? "---" : currentMl}
          </Text>

          
          <Text style={[styles.mlLabel, isDisconnected && styles.mlLabelDim]}>
            {isDisconnected ? "Frånkopplad" : "ml kvar"}
          </Text>
        </View>
      </Animated.View>

      
      {isOffScale && (
        <Animated.View
          style={[styles.drinkingLabelContainer, bottlePulseStyle]}
        >
          <Text style={styles.drinkingLabel}>Dricker...</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    alignItems: "center",
  },
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  capsuleOuter: {
    borderWidth: 2,
    overflow: "hidden",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  capsuleInner: {
    overflow: "hidden",
    position: "relative",
    alignSelf: "center",
  },
  glassBg: {
    ...StyleSheet.absoluteFillObject,
  },
  waterFill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
  },
  waveLayer: {
    position: "absolute",
    top: -10,
    left: 0,
    right: 0,
    height: 26,
    overflow: "hidden",
    zIndex: 2,
  },
  waveScroll: {
    position: "absolute",
    left: 0,
    top: 0,
    flexDirection: "row",
  },
  waterBody: {
    flex: 1,
    marginTop: 6,
  },
  glassReflection: {
    position: "absolute",
    top: 0,
    left: 8,
    width: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  textOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    pointerEvents: "none",
  },
  textBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    borderRadius: 100,
  },
  dropContainer: {
    marginBottom: 2,
  },
  mlNumber: {
    fontSize: 48,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -2,
    marginTop: 2,
    ...(Platform.OS === "ios"
      ? {
          textShadowColor: "rgba(0, 0, 0, 0.35)",
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 8,
        }
      : {}),
  },
  mlNumberDim: {
    color: "rgba(255,255,255,0.3)",
  },
  mlLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 0.5,
    marginTop: -4,
    ...(Platform.OS === "ios"
      ? {
          textShadowColor: "rgba(0, 0, 0, 0.2)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 4,
        }
      : {}),
  },
  mlLabelDim: {
    color: "rgba(255,255,255,0.25)",
  },
  drinkingLabelContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
  },
  drinkingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.waterMid,
    letterSpacing: 0.3,
  },
});
