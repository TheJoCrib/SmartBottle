import { Id } from "../convex/_generated/dataModel";

export interface User {
  _id: Id<"users">;
  email: string;
  name: string;
  avatar?: string;
  height?: number;
  weight?: number;
  age?: number;
  gender?: "male" | "female" | "other";
  activityLevel?: ActivityLevel;
  medicalConditions?: MedicalCondition[];
  dailyGoalMl: number;
  customGoal: boolean;
  xp: number;
  level: number;
  createdAt: number;
}

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type MedicalCondition =
  | "kidney_issues"
  | "heart_condition"
  | "pregnancy"
  | "diabetes"
  | "other";

export interface Bottle {
  _id: Id<"bottles">;
  userId: Id<"users">;
  name: string;
  icon: string;
  color: string;
  capacityMl: number;
  emptyWeightG: number;
  fullWeightG: number;
  bleDeviceId?: string;
  isActive: boolean;
  createdAt: number;
}

export interface DrinkLog {
  _id: Id<"drinkLogs">;
  userId: Id<"users">;
  bottleId?: Id<"bottles">;
  beverageTypeId: Id<"beverageTypes">;
  amountMl: number;
  timestamp: number;
  isManual: boolean;
}

export interface BeverageType {
  _id: Id<"beverageTypes">;
  name: string;
  icon: string;
  isDefault: boolean;
  userId?: Id<"users">;
  caffeineContent?: number;
  calories?: number;
}

export interface Achievement {
  _id: Id<"achievements">;
  key: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  criteria: AchievementCriteria;
}

export interface AchievementCriteria {
  type: "total_ml" | "streak_days" | "bottles_filled" | "days_active";
  value: number;
}

export interface UserAchievement {
  _id: Id<"userAchievements">;
  userId: Id<"users">;
  achievementId: Id<"achievements">;
  unlockedAt: number;
}

export interface Streak {
  _id: Id<"streaks">;
  userId: Id<"users">;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
}

export interface Friendship {
  _id: Id<"friendships">;
  userId: Id<"users">;
  friendId: Id<"users">;
  status: "pending" | "accepted" | "rejected";
  createdAt: number;
}

export interface Challenge {
  _id: Id<"challenges">;
  creatorId: Id<"users">;
  name: string;
  description: string;
  goalMl: number;
  startDate: string;
  endDate: string;
  participants: Id<"users">[];
}

export interface BLEDevice {
  id: string;
  name: string | null;
  rssi: number | null;
  isConnected: boolean;
}

export interface WeightData {
  weightG: number;
  timestamp: number;
}

export interface DailyStats {
  date: string;
  totalMl: number;
  goalMl: number;
  percentage: number;
  drinkCount: number;
}

export interface WeeklyStats {
  weekStart: string;
  totalMl: number;
  averageDailyMl: number;
  daysGoalMet: number;
}

export interface NotificationSettings {
  scheduledReminders: boolean;
  reminderIntervalHours: number;
  smartReminders: boolean;
  goalAlerts: boolean;
  motivationalMessages: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export type ThemeMode = "light" | "dark" | "system";

export interface AppSettings {
  theme: ThemeMode;
  notifications: NotificationSettings;
  minimalSocialMode: boolean;
  units: "metric" | "imperial";
}
