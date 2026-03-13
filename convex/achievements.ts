import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return [];
    }

    const achievements = await ctx.db.query("achievements").collect();

    const userAchievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_user", (q) => q.eq("userId", session.userId))
      .collect();

    const unlockedIds = new Set(
      userAchievements.map((ua) => ua.achievementId.toString())
    );

    return achievements.map((achievement) => ({
      ...achievement,
      unlocked: unlockedIds.has(achievement._id.toString()),
      unlockedAt: userAchievements.find(
        (ua) => ua.achievementId.toString() === achievement._id.toString()
      )?.unlockedAt,
    }));
  },
});

export const checkAndUnlock = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return [];
    }

    const userId = session.userId;
    const user = await ctx.db.get(userId);
    if (!user) return [];

    const logs = await ctx.db
      .query("drinkLogs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const totalMl = logs.reduce((sum, log) => sum + log.amountMl, 0);

    const streak = await ctx.db
      .query("streaks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const activeDays = new Set(
      logs.map((log) => new Date(log.timestamp).toISOString().split("T")[0])
    ).size;

    const achievements = await ctx.db.query("achievements").collect();

    const userAchievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const unlockedIds = new Set(
      userAchievements.map((ua) => ua.achievementId.toString())
    );

    const newlyUnlocked = [];

    for (const achievement of achievements) {
      if (unlockedIds.has(achievement._id.toString())) {
        continue;
      }

      let shouldUnlock = false;

      switch (achievement.criteriaType) {
        case "total_ml":
          shouldUnlock = totalMl >= achievement.criteriaValue;
          break;
        case "streak_days":
          shouldUnlock =
            (streak?.currentStreak || 0) >= achievement.criteriaValue;
          break;
        case "days_active":
          shouldUnlock = activeDays >= achievement.criteriaValue;
          break;
        case "bottles_filled":
          shouldUnlock = totalMl / 500 >= achievement.criteriaValue;
          break;
      }

      if (shouldUnlock) {
        await ctx.db.insert("userAchievements", {
          userId,
          achievementId: achievement._id,
          unlockedAt: Date.now(),
        });

        await ctx.db.patch(userId, {
          xp: user.xp + achievement.xpReward,
        });

        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  },
});

export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("achievements").first();
    if (existing) {
      return { message: "Achievements already seeded" };
    }

    const achievements = [
      {
        key: "first_sip",
        name: "First Sip",
        description: "Log your first drink",
        icon: "💧",
        xpReward: 10,
        criteriaType: "total_ml" as const,
        criteriaValue: 1,
      },
      {
        key: "hydration_starter",
        name: "Hydration Starter",
        description: "Drink 1 liter total",
        icon: "🚰",
        xpReward: 50,
        criteriaType: "total_ml" as const,
        criteriaValue: 1000,
      },
      {
        key: "hydration_apprentice",
        name: "Hydration Apprentice",
        description: "Drink 10 liters total",
        icon: "🌊",
        xpReward: 100,
        criteriaType: "total_ml" as const,
        criteriaValue: 10000,
      },
      {
        key: "hydration_master",
        name: "Hydration Master",
        description: "Drink 100 liters total",
        icon: "🏆",
        xpReward: 500,
        criteriaType: "total_ml" as const,
        criteriaValue: 100000,
      },
      {
        key: "hydration_legend",
        name: "Hydration Legend",
        description: "Drink 500 liters total",
        icon: "👑",
        xpReward: 1000,
        criteriaType: "total_ml" as const,
        criteriaValue: 500000,
      },

      {
        key: "streak_3",
        name: "Getting Started",
        description: "3 day streak",
        icon: "🔥",
        xpReward: 30,
        criteriaType: "streak_days" as const,
        criteriaValue: 3,
      },
      {
        key: "streak_7",
        name: "Week Warrior",
        description: "7 day streak",
        icon: "⚡",
        xpReward: 70,
        criteriaType: "streak_days" as const,
        criteriaValue: 7,
      },
      {
        key: "streak_30",
        name: "Monthly Master",
        description: "30 day streak",
        icon: "🌟",
        xpReward: 300,
        criteriaType: "streak_days" as const,
        criteriaValue: 30,
      },
      {
        key: "streak_100",
        name: "Centurion",
        description: "100 day streak",
        icon: "💎",
        xpReward: 1000,
        criteriaType: "streak_days" as const,
        criteriaValue: 100,
      },
      {
        key: "streak_365",
        name: "Year of Hydration",
        description: "365 day streak",
        icon: "🎖️",
        xpReward: 5000,
        criteriaType: "streak_days" as const,
        criteriaValue: 365,
      },

      {
        key: "active_7",
        name: "First Week",
        description: "Active for 7 days",
        icon: "📅",
        xpReward: 50,
        criteriaType: "days_active" as const,
        criteriaValue: 7,
      },
      {
        key: "active_30",
        name: "Monthly Regular",
        description: "Active for 30 days",
        icon: "📆",
        xpReward: 200,
        criteriaType: "days_active" as const,
        criteriaValue: 30,
      },
      {
        key: "active_100",
        name: "Dedicated Drinker",
        description: "Active for 100 days",
        icon: "🗓️",
        xpReward: 500,
        criteriaType: "days_active" as const,
        criteriaValue: 100,
      },
    ];

    for (const achievement of achievements) {
      await ctx.db.insert("achievements", achievement);
    }

    return { message: "Achievements seeded successfully" };
  },
});
