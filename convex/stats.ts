import { v } from "convex/values";
import { query } from "./_generated/server";

export const getToday = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const logs = await ctx.db
      .query("drinkLogs")
      .withIndex("by_user_and_timestamp", (q) =>
        q.eq("userId", session.userId).gte("timestamp", todayStart.getTime())
      )
      .collect();

    const totalMl = logs.reduce((sum, log) => sum + log.amountMl, 0);
    const percentage = Math.round((totalMl / user.dailyGoalMl) * 100);

    return {
      date: todayStart.toISOString().split("T")[0],
      totalMl,
      goalMl: user.dailyGoalMl,
      percentage: Math.min(percentage, 100),
      drinkCount: logs.length,
    };
  },
});

export const getWeekly = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);

    const logs = await ctx.db
      .query("drinkLogs")
      .withIndex("by_user_and_timestamp", (q) =>
        q.eq("userId", session.userId).gte("timestamp", weekStart.getTime())
      )
      .collect();

    const dailyTotals: Record<string, number> = {};
    logs.forEach((log) => {
      const date = new Date(log.timestamp).toISOString().split("T")[0];
      dailyTotals[date] = (dailyTotals[date] || 0) + log.amountMl;
    });

    const days = Object.keys(dailyTotals).length || 1;
    const totalMl = logs.reduce((sum, log) => sum + log.amountMl, 0);
    const daysGoalMet = Object.values(dailyTotals).filter(
      (ml) => ml >= user.dailyGoalMl
    ).length;

    const dailyBreakdown = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const dayMl = dailyTotals[dateStr] || 0;
      dailyBreakdown.push({
        date: dateStr,
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        totalMl: dayMl,
        goalMl: user.dailyGoalMl,
        percentage: Math.min(Math.round((dayMl / user.dailyGoalMl) * 100), 100),
      });
    }

    return {
      weekStart: weekStart.toISOString().split("T")[0],
      totalMl,
      averageDailyMl: Math.round(totalMl / days),
      daysGoalMet,
      dailyBreakdown,
    };
  },
});

export const getMonthly = query({
  args: {
    token: v.string(),
    month: v.optional(v.number()),
    year: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    const now = new Date();
    const month = args.month ?? now.getMonth();
    const year = args.year ?? now.getFullYear();

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const logs = await ctx.db
      .query("drinkLogs")
      .withIndex("by_user_and_timestamp", (q) =>
        q
          .eq("userId", session.userId)
          .gte("timestamp", monthStart.getTime())
          .lte("timestamp", monthEnd.getTime())
      )
      .collect();

    const dailyTotals: Record<string, number> = {};
    logs.forEach((log) => {
      const date = new Date(log.timestamp).toISOString().split("T")[0];
      dailyTotals[date] = (dailyTotals[date] || 0) + log.amountMl;
    });

    const daysInMonth = monthEnd.getDate();
    const activeDays = Object.keys(dailyTotals).length;
    const totalMl = logs.reduce((sum, log) => sum + log.amountMl, 0);
    const daysGoalMet = Object.values(dailyTotals).filter(
      (ml) => ml >= user.dailyGoalMl
    ).length;

    const dailyBreakdown = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateStr = date.toISOString().split("T")[0];
      const dayMl = dailyTotals[dateStr] || 0;
      dailyBreakdown.push({
        date: dateStr,
        day: i,
        totalMl: dayMl,
        goalMl: user.dailyGoalMl,
        percentage: Math.min(Math.round((dayMl / user.dailyGoalMl) * 100), 100),
      });
    }

    return {
      month,
      year,
      monthName: monthStart.toLocaleDateString("en-US", { month: "long" }),
      totalMl,
      averageDailyMl: activeDays > 0 ? Math.round(totalMl / activeDays) : 0,
      daysGoalMet,
      activeDays,
      dailyBreakdown,
    };
  },
});

export const getStreak = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const streak = await ctx.db
      .query("streaks")
      .withIndex("by_user", (q) => q.eq("userId", session.userId))
      .first();

    return streak || { currentStreak: 0, longestStreak: 0, lastActiveDate: "" };
  },
});

export const getAllTime = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    const logs = await ctx.db
      .query("drinkLogs")
      .withIndex("by_user", (q) => q.eq("userId", session.userId))
      .collect();

    const dailyTotals: Record<string, number> = {};
    logs.forEach((log) => {
      const date = new Date(log.timestamp).toISOString().split("T")[0];
      dailyTotals[date] = (dailyTotals[date] || 0) + log.amountMl;
    });

    const totalMl = logs.reduce((sum, log) => sum + log.amountMl, 0);
    const activeDays = Object.keys(dailyTotals).length;
    const daysGoalMet = Object.values(dailyTotals).filter(
      (ml) => ml >= user.dailyGoalMl
    ).length;

    const streak = await ctx.db
      .query("streaks")
      .withIndex("by_user", (q) => q.eq("userId", session.userId))
      .first();

    return {
      totalMl,
      totalLiters: (totalMl / 1000).toFixed(1),
      totalDrinks: logs.length,
      activeDays,
      daysGoalMet,
      averageDailyMl: activeDays > 0 ? Math.round(totalMl / activeDays) : 0,
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      xp: user.xp,
      level: user.level,
    };
  },
});
