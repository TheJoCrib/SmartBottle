
export const BOTTLE_CAPACITIES = [
  { value: 250, label: "250ml" },
  { value: 350, label: "350ml" },
  { value: 500, label: "500ml" },
  { value: 750, label: "750ml" },
  { value: 1000, label: "1L" },
  { value: 1500, label: "1.5L" },
  { value: 2000, label: "2L" },
];

export const BOTTLE_COLORS = [
  "#0EA5E9",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#64748B",
];

export const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary", description: "Little to no exercise" },
  { value: "light", label: "Light", description: "Exercise 1-3 days/week" },
  { value: "moderate", label: "Moderate", description: "Exercise 3-5 days/week" },
  { value: "active", label: "Active", description: "Exercise 6-7 days/week" },
  { value: "very_active", label: "Very Active", description: "Hard exercise daily" },
];

export const QUICK_LOG_AMOUNTS = [100, 200, 250, 330, 500, 750, 1000];

export const BLE_SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0";
export const BLE_WEIGHT_CHAR_UUID = "12345678-1234-5678-1234-56789abcdef1";
export const BLE_COMMAND_CHAR_UUID = "12345678-1234-5678-1234-56789abcdef3";

export const REFILL_THRESHOLD_G = 50;
export const CONSUMPTION_THRESHOLD_G = 10;
export const OFF_SCALE_MARGIN_G = 20;

export const DEFAULT_REMINDER_INTERVAL_HOURS = 2;
export const DEFAULT_QUIET_HOURS_START = "22:00";
export const DEFAULT_QUIET_HOURS_END = "08:00";

export const CACHE_DURATION_MS = 5 * 60 * 1000;
export const OFFLINE_QUEUE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
