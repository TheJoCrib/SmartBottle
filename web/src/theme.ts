export const colors = {
  background: "#0F172A",
  surface: "#1E293B",
  elevated: "#334155",

  primary: "#3B82F6",
  primaryMuted: "rgba(59, 130, 246, 0.12)",
  accent: "#38BDF8",

  waterLight: "#7DD3FC",
  waterMid: "#38BDF8",
  waterDark: "#0369A1",

  textPrimary: "#F1F5F9",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",

  success: "#4ADE80",
  warning: "#FBBF24",
  warningMuted: "rgba(251, 191, 36, 0.12)",

  border: "rgba(255, 255, 255, 0.06)",
  borderMedium: "rgba(255, 255, 255, 0.12)",
} as const;

export const spacing = {
  page: 20,
  cardRadius: 16,
} as const;

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "God natt";
  if (hour < 12) return "God morgon";
  if (hour < 18) return "God eftermiddag";
  return "God kväll";
}
