import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
    height: v.optional(v.number()),
    weight: v.optional(v.number()),
    age: v.optional(v.number()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"))),
    activityLevel: v.optional(
      v.union(
        v.literal("sedentary"),
        v.literal("light"),
        v.literal("moderate"),
        v.literal("active"),
        v.literal("very_active")
      )
    ),
    medicalConditions: v.optional(v.array(v.string())),
    dailyGoalMl: v.number(),
    customGoal: v.boolean(),
    xp: v.number(),
    level: v.number(),
    createdAt: v.number(),
    mirrorShareCode: v.optional(v.string()),
    mirrorEnabled: v.optional(v.boolean()),
  })
    .index("by_email", ["email"])
    .index("by_mirror_code", ["mirrorShareCode"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  bottles: defineTable({
    userId: v.id("users"),
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    capacityMl: v.number(),
    emptyWeightG: v.number(),
    fullWeightG: v.number(),
    bleDeviceId: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    lastRefillAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_ble_device", ["bleDeviceId"]),

  drinkLogs: defineTable({
    userId: v.id("users"),
    bottleId: v.optional(v.id("bottles")),
    beverageTypeId: v.id("beverageTypes"),
    amountMl: v.number(),
    timestamp: v.number(),
    isManual: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_timestamp", ["userId", "timestamp"])
    .index("by_bottle", ["bottleId"]),

  beverageTypes: defineTable({
    name: v.string(),
    icon: v.string(),
    isDefault: v.boolean(),
    userId: v.optional(v.id("users")),
    caffeineContent: v.optional(v.number()),
    calories: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_default", ["isDefault"]),

  achievements: defineTable({
    key: v.string(),
    name: v.string(),
    description: v.string(),
    icon: v.string(),
    xpReward: v.number(),
    criteriaType: v.union(
      v.literal("total_ml"),
      v.literal("streak_days"),
      v.literal("bottles_filled"),
      v.literal("days_active")
    ),
    criteriaValue: v.number(),
  })
    .index("by_key", ["key"]),

  userAchievements: defineTable({
    userId: v.id("users"),
    achievementId: v.id("achievements"),
    unlockedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_achievement", ["userId", "achievementId"]),

  streaks: defineTable({
    userId: v.id("users"),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastActiveDate: v.string(),
  })
    .index("by_user", ["userId"]),

  friendships: defineTable({
    userId: v.id("users"),
    friendId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_friend", ["friendId"])
    .index("by_users", ["userId", "friendId"]),

  challenges: defineTable({
    creatorId: v.id("users"),
    name: v.string(),
    description: v.string(),
    goalMl: v.number(),
    startDate: v.string(),
    endDate: v.string(),
    participants: v.array(v.id("users")),
  })
    .index("by_creator", ["creatorId"]),

  challengeProgress: defineTable({
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    totalMl: v.number(),
    lastUpdated: v.number(),
  })
    .index("by_challenge", ["challengeId"])
    .index("by_user", ["userId"])
    .index("by_challenge_and_user", ["challengeId", "userId"]),
});
