
import React from "react";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

type IconLib = "Feather" | "Ionicons" | "MaterialCommunityIcons";

interface IconDef {
  library: IconLib;
  name: string;
  label: string;
}

export const BOTTLE_TYPE_ICONS: IconDef[] = [
  { library: "MaterialCommunityIcons", name: "bottle-wine", label: "Flaska" },
  { library: "Ionicons", name: "water-outline", label: "Vatten" },
  { library: "MaterialCommunityIcons", name: "cup-water", label: "Mugg" },
  { library: "MaterialCommunityIcons", name: "coffee-outline", label: "Kaffe" },
  { library: "MaterialCommunityIcons", name: "bottle-tonic-outline", label: "Termos" },
  { library: "MaterialCommunityIcons", name: "glass-mug-variant", label: "Glas" },
  { library: "MaterialCommunityIcons", name: "cup-outline", label: "Kopp" },
  { library: "MaterialCommunityIcons", name: "bottle-soda-classic-outline", label: "Soda" },
];

export const MEDICAL_CONDITION_ICONS: Record<string, IconDef> = {
  kidney: { library: "MaterialCommunityIcons", name: "circle-outline", label: "Njursjukdom" },
  heart: { library: "Ionicons", name: "heart-outline", label: "Hjärtsjukdom" },
  pregnant: { library: "MaterialCommunityIcons", name: "human-female", label: "Gravid" },
  diabetes: { library: "MaterialCommunityIcons", name: "medical-bag", label: "Diabetes" },
  blood_pressure: { library: "MaterialCommunityIcons", name: "heart-pulse", label: "Blodtryck" },
  water_retention: { library: "Ionicons", name: "water-outline", label: "Vätskeretention" },
  kidney_stones: { library: "MaterialCommunityIcons", name: "rhombus-outline", label: "Njurstenar" },
  none: { library: "Feather", name: "check-circle", label: "Inga" },
};

export const BEVERAGE_ICONS: Record<string, IconDef> = {
  water: { library: "Ionicons", name: "water-outline", label: "Vatten" },
  sparkling: { library: "MaterialCommunityIcons", name: "water", label: "Kolsyrat" },
  tea: { library: "MaterialCommunityIcons", name: "tea", label: "Te" },
  coffee: { library: "MaterialCommunityIcons", name: "coffee", label: "Kaffe" },
  juice: { library: "MaterialCommunityIcons", name: "cup-water", label: "Juice" },
  milk: { library: "MaterialCommunityIcons", name: "cup", label: "Mjölk" },
  sports: { library: "Ionicons", name: "fitness-outline", label: "Sportdryck" },
  other: { library: "Feather", name: "droplet", label: "Annat" },
};

export const MILESTONE_ICONS: Record<string, IconDef> = {
  first_drink: { library: "Ionicons", name: "water", label: "Första drycken" },
  first_week: { library: "Feather", name: "calendar", label: "Första veckan" },
  first_month: { library: "Feather", name: "award", label: "Första månaden" },
  streak_7: { library: "MaterialCommunityIcons", name: "fire", label: "7 dagars svit" },
  streak_30: { library: "MaterialCommunityIcons", name: "fire", label: "30 dagars svit" },
  streak_100: { library: "MaterialCommunityIcons", name: "fire", label: "100 dagars svit" },
  total_10l: { library: "Ionicons", name: "trophy-outline", label: "10 liter totalt" },
  total_100l: { library: "Ionicons", name: "trophy-outline", label: "100 liter totalt" },
  total_500l: { library: "Ionicons", name: "trophy-outline", label: "500 liter totalt" },
  total_1000l: { library: "Ionicons", name: "trophy-outline", label: "1000 liter totalt" },
  goal_met: { library: "Feather", name: "target", label: "Mål uppnått" },
  weekly_goal: { library: "Feather", name: "target", label: "Veckomål uppnått" },
  monthly_goal: { library: "Feather", name: "target", label: "Månadsmål uppnått" },
};

export const ACTIVITY_ICONS: Record<string, IconDef> = {
  sedentary: { library: "MaterialCommunityIcons", name: "sofa-outline", label: "Stillasittande" },
  light: { library: "MaterialCommunityIcons", name: "walk", label: "Lätt" },
  moderate: { library: "MaterialCommunityIcons", name: "run", label: "Måttlig" },
  active: { library: "MaterialCommunityIcons", name: "run-fast", label: "Aktiv" },
  very_active: { library: "MaterialCommunityIcons", name: "weight-lifter", label: "Mycket aktiv" },
};

export function renderIcon(
  def: IconDef,
  size: number = 20,
  color: string = "#64748B"
): React.ReactElement {
  switch (def.library) {
    case "Feather":
      return React.createElement(Feather, { name: def.name as any, size, color });
    case "Ionicons":
      return React.createElement(Ionicons, { name: def.name as any, size, color });
    case "MaterialCommunityIcons":
      return React.createElement(MaterialCommunityIcons, { name: def.name as any, size, color });
  }
}

export function getIconForEmoji(emoji: string): IconDef {
  const emojiMap: Record<string, IconDef> = {
    "💧": { library: "Ionicons", name: "water-outline", label: "Vatten" },
    "🍶": { library: "MaterialCommunityIcons", name: "bottle-wine", label: "Flaska" },
    "🫗": { library: "MaterialCommunityIcons", name: "cup-water", label: "Mugg" },
    "🧴": { library: "MaterialCommunityIcons", name: "bottle-soda-classic-outline", label: "Flaska" },
    "🥤": { library: "MaterialCommunityIcons", name: "cup", label: "Mugg" },
    "🍼": { library: "MaterialCommunityIcons", name: "baby-bottle-outline", label: "Flaska" },
    "🏺": { library: "MaterialCommunityIcons", name: "pot-outline", label: "Kruka" },
    "🪣": { library: "MaterialCommunityIcons", name: "bucket-outline", label: "Hink" },
    "🔥": { library: "MaterialCommunityIcons", name: "fire", label: "Eld" },
    "✅": { library: "Feather", name: "check-circle", label: "Klar" },
    "🔒": { library: "Feather", name: "lock", label: "Låst" },
    "👤": { library: "Feather", name: "user", label: "Användare" },
    "🥇": { library: "Ionicons", name: "trophy", label: "Guld" },
    "🥈": { library: "Ionicons", name: "trophy-outline", label: "Silver" },
    "🥉": { library: "Ionicons", name: "trophy-outline", label: "Brons" },
  };
  return emojiMap[emoji] || { library: "Feather", name: "circle", label: "Okänd" };
}
