
export const colors = {
  background: "#0F172A",
  surface: "#1E293B",
  elevated: "#334155",
  overlay: "#475569",

  primary: "#3B82F6",
  primaryLight: "#60A5FA",
  primaryMuted: "rgba(59, 130, 246, 0.12)",
  accent: "#38BDF8",

  waterLight: "#7DD3FC",
  waterMid: "#38BDF8",
  waterDark: "#0369A1",
  waterGradient: ["#7DD3FC", "#38BDF8", "#0369A1"] as const,

  textPrimary: "#F1F5F9",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",

  success: "#4ADE80",
  successMuted: "rgba(74, 222, 128, 0.12)",
  warning: "#FBBF24",
  warningMuted: "rgba(251, 191, 36, 0.12)",
  error: "#F87171",
  errorMuted: "rgba(248, 113, 113, 0.12)",

  border: "rgba(255, 255, 255, 0.06)",
  borderMedium: "rgba(255, 255, 255, 0.12)",

  tabActive: "#38BDF8",
  tabInactive: "#64748B",

  inputBg: "rgba(255, 255, 255, 0.08)",
  inputBorder: "rgba(255, 255, 255, 0.12)",
  inputFocusBorder: "#3B82F6",
  inputPlaceholder: "#64748B",
} as const;

export const typography = {
  header: {
    fontSize: 28,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  title: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: colors.textMuted,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
    color: colors.textMuted,
  },
  bigNumber: {
    fontSize: 48,
    fontWeight: "800" as const,
    letterSpacing: -2,
    color: colors.textPrimary,
  },
} as const;

export const spacing = {
  page: 20,
  cardRadius: 16,
  cardPadding: 16,
  sectionGap: 24,
  itemGap: 12,
  rowHeight: 52,
  separatorInset: 56,
} as const;
