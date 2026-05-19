import React from "react";
import Svg, { Path, Rect, Circle, G } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export function WaterBottleIcon({ size = 28, color = "#94A3B8" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 2h8v3H8V2z" fill={color} opacity={0.4} />
      <Path d="M9 5h6l1 3v11a2 2 0 01-2 2h-4a2 2 0 01-2-2V8l1-3z" stroke={color} strokeWidth={1.8} fill="none" />
      <Path d="M9 14h6" stroke={color} strokeWidth={1} opacity={0.3} />
    </Svg>
  );
}

export function GlassBottleIcon({ size = 28, color = "#94A3B8" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M10 2h4v4l2 2v11a2 2 0 01-2 2h-4a2 2 0 01-2-2V8l2-2V2z" stroke={color} strokeWidth={1.8} fill="none" />
      <Path d="M10 2h4v2h-4V2z" fill={color} opacity={0.4} />
      <Path d="M8 13h8" stroke={color} strokeWidth={1} opacity={0.3} />
    </Svg>
  );
}

export function SportBottleIcon({ size = 28, color = "#94A3B8" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={9} y={2} width={6} height={3} rx={1} fill={color} opacity={0.4} />
      <Path d="M9 5h6l1.5 2v12a2 2 0 01-2 2h-5a2 2 0 01-2-2V7L9 5z" stroke={color} strokeWidth={1.8} fill="none" />
      <Path d="M7.5 10h9" stroke={color} strokeWidth={1} opacity={0.3} />
      <Path d="M10 5v-1" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

export function ThermosIcon({ size = 28, color = "#94A3B8" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={8} y={2} width={8} height={3} rx={1.5} fill={color} opacity={0.4} />
      <Rect x={9} y={5} width={6} height={16} rx={3} stroke={color} strokeWidth={1.8} fill="none" />
      <Path d="M9 8h6" stroke={color} strokeWidth={1} opacity={0.3} />
    </Svg>
  );
}

export function CoffeeMugIcon({ size = 28, color = "#94A3B8" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 7h10v10a3 3 0 01-3 3H9a3 3 0 01-3-3V7z" stroke={color} strokeWidth={1.8} fill="none" />
      <Path d="M16 9h1.5a2.5 2.5 0 010 5H16" stroke={color} strokeWidth={1.8} fill="none" />
      <Path d="M6 5h10" stroke={color} strokeWidth={1.5} opacity={0.4} />
    </Svg>
  );
}

export function BottleIcon({ modelKey, size = 28, color = "#94A3B8" }: IconProps & { modelKey: string }) {
  switch (modelKey) {
    case "glass-bottle": return <GlassBottleIcon size={size} color={color} />;
    case "sport-bottle": return <SportBottleIcon size={size} color={color} />;
    case "thermos": return <ThermosIcon size={size} color={color} />;
    case "coffee-mug": return <CoffeeMugIcon size={size} color={color} />;
    case "water-bottle":
    default: return <WaterBottleIcon size={size} color={color} />;
  }
}
