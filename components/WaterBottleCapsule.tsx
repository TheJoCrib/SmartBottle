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

interface WaterBottleCapsuleProps {
  currentMl: number;
  maxMl: number;
  width?: number;
  height?: number;
}

function generateWavePath(
  w: number,
  amplitude: number,
  frequency: number,
  phaseOffset: number
): string {
  const totalWidth = w * 2;
  const waveHeight = amplitude * 2 + 2;
  let d = `M 0 ${amplitude + 1}`;
  for (let x = 0; x <= totalWidth; x += 3) {
    const normalized = x / w;
    const y =
      amplitude +
      1 +
      Math.sin(normalized * Math.PI * 2 * frequency + phaseOffset) * amplitude;
    d += ` L ${x} ${y}`;
  }
  d += ` L ${totalWidth} ${waveHeight + 20} L 0 ${waveHeight + 20} Z`;
  return d;
}

export function WaterBottleCapsule({
  currentMl,
  maxMl,
  width = 180,
  height = 310,
}: WaterBottleCapsuleProps) {
  const borderRadius = width / 2;
  const padding = 4;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const fillRatio = maxMl > 0 ? Math.min(1, Math.max(0, currentMl / maxMl)) : 0;

  const waterLevel = useSharedValue(fillRatio);
  const wave1Phase = useSharedValue(0);
  const wave2Phase = useSharedValue(0);
  const dropBounce = useSharedValue(0);

  useEffect(() => {
    waterLevel.value = withSpring(fillRatio, {
      damping: 18,
      stiffness: 60,
      mass: 1,
    });
  }, [fillRatio]);

  useEffect(() => {
    wave1Phase.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.linear }),
      -1,
      false
    );
    wave2Phase.value = withRepeat(
      withTiming(1, { duration: 4200, easing: Easing.linear }),
      -1,
      false
    );
    dropBounce.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
      -1,
      true
    );
    return () => {
      cancelAnimation(wave1Phase);
      cancelAnimation(wave2Phase);
      cancelAnimation(dropBounce);
    };
  }, []);

  const waterContainerStyle = useAnimatedStyle(() => {
    const h = waterLevel.value * innerHeight;
    return {
      height: Math.max(0, h),
    };
  });

  const wave1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: -wave1Phase.value * innerWidth }],
  }));

  const wave2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: -wave2Phase.value * innerWidth }],
  }));

  const dropStyle = useAnimatedStyle(() => {
    const translateY = interpolate(dropBounce.value, [0, 1], [-2, 3]);
    return {
      transform: [{ translateY }],
    };
  });

  const wave1Path = useMemo(
    () => generateWavePath(innerWidth, 7, 1.2, 0),
    [innerWidth]
  );
  const wave2Path = useMemo(
    () => generateWavePath(innerWidth, 5, 1.8, Math.PI * 0.7),
    [innerWidth]
  );

  const waveAreaHeight = 22;

  return (
    <View style={styles.wrapper}>
      
      <View
        style={[
          styles.capsuleOuter,
          {
            width,
            height,
            borderRadius,
          },
        ]}
      >
        
        <View
          style={[
            styles.capsuleInner,
            {
              width: innerWidth,
              height: innerHeight,
              borderRadius: borderRadius - padding,
            },
          ]}
        >
          
          <View
            style={[
              styles.glassBackground,
              { borderRadius: borderRadius - padding },
            ]}
          />

          
          <Animated.View style={[styles.waterFill, waterContainerStyle]}>
            
            <View style={styles.waveLayer}>
              <Animated.View style={[styles.waveScroll, wave1Style]}>
                <Svg
                  width={innerWidth * 2}
                  height={waveAreaHeight}
                  viewBox={`0 0 ${innerWidth * 2} ${waveAreaHeight}`}
                >
                  <Defs>
                    <SvgLinearGradient id="wave1Grad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#7DD3FC" stopOpacity="0.9" />
                      <Stop offset="1" stopColor="#38BDF8" stopOpacity="0.7" />
                    </SvgLinearGradient>
                  </Defs>
                  <SvgPath d={wave1Path} fill="url(#wave1Grad)" />
                </Svg>
              </Animated.View>
            </View>

            
            <View style={[styles.waveLayer, { top: 2 }]}>
              <Animated.View style={[styles.waveScroll, wave2Style]}>
                <Svg
                  width={innerWidth * 2}
                  height={waveAreaHeight}
                  viewBox={`0 0 ${innerWidth * 2} ${waveAreaHeight}`}
                >
                  <SvgPath d={wave2Path} fill="#38BDF8" opacity={0.5} />
                </Svg>
              </Animated.View>
            </View>

            
            <View style={styles.waterBody}>
              <Svg
                width={innerWidth}
                height={innerHeight}
                preserveAspectRatio="none"
              >
                <Defs>
                  <SvgLinearGradient
                    id="waterGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <Stop offset="0" stopColor="#22B8E8" stopOpacity="1" />
                    <Stop offset="0.4" stopColor="#0EA5E9" stopOpacity="1" />
                    <Stop offset="0.8" stopColor="#0284C7" stopOpacity="1" />
                    <Stop offset="1" stopColor="#0369A1" stopOpacity="1" />
                  </SvgLinearGradient>
                </Defs>
                <Rect
                  x="0"
                  y="0"
                  width={innerWidth}
                  height={innerHeight}
                  fill="url(#waterGrad)"
                />
              </Svg>
            </View>
          </Animated.View>

          
          <View style={[styles.glassReflection, { height: height * 0.6 }]} />
        </View>
      </View>

      
      <View style={[styles.textOverlay, { width, height }]}>
        
        <View style={styles.textBackdrop} />

        
        <Animated.View style={[styles.dropContainer, dropStyle]}>
          <Ionicons name="water" size={28} color="rgba(255,255,255,0.9)" />
        </Animated.View>

        
        <Text style={styles.mlNumber}>{currentMl}</Text>
        <Text style={styles.mlLabel}>ml kvar</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  capsuleOuter: {
    borderWidth: 2.5,
    borderColor: "rgba(148, 163, 184, 0.25)",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  capsuleInner: {
    margin: 0,
    overflow: "hidden",
    position: "relative",
  },
  glassBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(148, 163, 184, 0.08)",
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
    top: -8,
    left: 0,
    right: 0,
    height: 22,
    overflow: "hidden",
    zIndex: 2,
  },
  waveScroll: {
    flexDirection: "row",
    position: "absolute",
    left: 0,
    top: 0,
  },
  waterBody: {
    flex: 1,
    marginTop: 6,
  },
  glassReflection: {
    position: "absolute",
    top: 0,
    left: 8,
    width: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  textOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
    pointerEvents: "none",
  },
  textBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    borderRadius: 90,
  },
  dropContainer: {
    marginBottom: 2,
  },
  mlNumber: {
    fontSize: 52,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -2,
    ...(Platform.OS === "ios"
      ? {
          textShadowColor: "rgba(0, 0, 0, 0.3)",
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 8,
        }
      : {}),
  },
  mlLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.75)",
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
});
