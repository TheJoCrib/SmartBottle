import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

async function validateSession(ctx: QueryCtx | MutationCtx, token: string): Promise<Id<"users">> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Invalid session");
  }

  return session.userId;
}

export const log = mutation({
  args: {
    token: v.string(),
    bottleId: v.optional(v.id("bottles")),
    beverageTypeId: v.id("beverageTypes"),
    amountMl: v.number(),
    isManual: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await validateSession(ctx, args.token);

    const drinkLogId = await ctx.db.insert("drinkLogs", {
      userId,
      bottleId: args.bottleId,
      beverageTypeId: args.beverageTypeId,
      amountMl: args.amountMl,
      timestamp: Date.now(),
      isManual: args.isManual,
    });

    const today = new Date().toISOString().split("T")[0];
    const streak = await ctx.db
      .query("streaks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (streak) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      let newCurrentStreak = streak.currentStreak;

      if (streak.lastActiveDate !== today) {
        if (streak.lastActiveDate === yesterday) {
          newCurrentStreak = streak.currentStreak + 1;
        } else if (streak.lastActiveDate !== today) {
          newCurrentStreak = streak.lastActiveDate ? 1 : 1;
        }

        await ctx.db.patch(streak._id, {
          currentStreak: newCurrentStreak,
          longestStreak: Math.max(streak.longestStreak, newCurrentStreak),
          lastActiveDate: today,
        });
      }
    }

    const user = await ctx.db.get(userId);
    if (user) {
      const xpGain = Math.floor(args.amountMl / 100);
      const newXp = user.xp + xpGain;
      const newLevel = Math.floor(newXp / 1000) + 1;

      await ctx.db.patch(userId, {
        xp: newXp,
        level: newLevel,
      });
    }

    return drinkLogId;
  },
});

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
      return [];
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const logs = await ctx.db
      .query("drinkLogs")
      .withIndex("by_user_and_timestamp", (q) =>
        q.eq("userId", session.userId).gte("timestamp", todayStart.getTime())
      )
      .collect();

    return logs;
  },
});

export const getByDateRange = query({
  args: {
    token: v.string(),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return [];
    }

    const logs = await ctx.db
      .query("drinkLogs")
      .withIndex("by_user_and_timestamp", (q) =>
        q
          .eq("userId", session.userId)
          .gte("timestamp", args.startDate)
          .lte("timestamp", args.endDate)
      )
      .collect();

    return logs;
  },
});

export const remove = mutation({
  args: {
    token: v.string(),
    drinkLogId: v.id("drinkLogs"),
  },
  handler: async (ctx, args) => {
    const userId = await validateSession(ctx, args.token);

    const log = await ctx.db.get(args.drinkLogId);
    if (!log || log.userId !== userId) {
      throw new Error("Drink log not found");
    }

    await ctx.db.delete(args.drinkLogId);

    return { success: true };
  },
});
