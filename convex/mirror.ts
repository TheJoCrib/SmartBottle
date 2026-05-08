import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const array = new Uint8Array(10);
  crypto.getRandomValues(array);
  let out = "";
  for (let i = 0; i < array.length; i++) {
    out += chars[array[i] % chars.length];
  }
  return out;
}

export const enable = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid session");
    }

    const user = await ctx.db.get(session.userId);
    if (!user) throw new Error("User not found");

    let code = user.mirrorShareCode;
    if (!code) {
      for (let i = 0; i < 5; i++) {
        const candidate = generateShareCode();
        const existing = await ctx.db
          .query("users")
          .withIndex("by_mirror_code", (q) => q.eq("mirrorShareCode", candidate))
          .first();
        if (!existing) {
          code = candidate;
          break;
        }
      }
      if (!code) throw new Error("Could not generate unique share code");
    }

    await ctx.db.patch(session.userId, {
      mirrorShareCode: code,
      mirrorEnabled: true,
    });

    return { code };
  },
});

export const disable = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid session");
    }
    await ctx.db.patch(session.userId, { mirrorEnabled: false });
    return { success: true };
  },
});

export const getMyShareCode = query({
  args: { token: v.string() },
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
    return {
      code: user.mirrorShareCode ?? null,
      enabled: user.mirrorEnabled === true,
    };
  },
});

export const getState = query({
  args: { shareCode: v.string() },
  handler: async (ctx, args) => {
    const code = args.shareCode.trim().toUpperCase();
    if (!code) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_mirror_code", (q) => q.eq("mirrorShareCode", code))
      .first();

    if (!user || user.mirrorEnabled !== true) {
      return null;
    }

    const bottles = await ctx.db
      .query("bottles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const drinks = await ctx.db
      .query("drinkLogs")
      .withIndex("by_user_and_timestamp", (q) =>
        q.eq("userId", user._id).gte("timestamp", todayStart.getTime()),
      )
      .collect();

    const streak = await ctx.db
      .query("streaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    const todayIntakeMl = drinks.reduce((sum, d) => sum + d.amountMl, 0);

    const lastDrink = drinks
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    return {
      presenter: { name: user.name },
      goal: { dailyGoalMl: user.dailyGoalMl },
      streak: streak?.currentStreak ?? 0,
      todayIntakeMl,
      drinks: drinks.map((d) => ({
        _id: d._id,
        bottleId: d.bottleId ?? null,
        amountMl: d.amountMl,
        timestamp: d.timestamp,
        isManual: d.isManual,
      })),
      lastDrink: lastDrink
        ? { amountMl: lastDrink.amountMl, timestamp: lastDrink.timestamp }
        : null,
      bottles: bottles.map((b) => {
        const bottleDrinks = drinks.filter((d) => d.bottleId === b._id);
        const consumedFromBottle = bottleDrinks.reduce(
          (sum, d) => sum + d.amountMl,
          0,
        );
        const capacity = Math.max(0, b.fullWeightG - b.emptyWeightG);
        const remaining = Math.max(0, capacity - consumedFromBottle);
        const fillPercentage = capacity > 0 ? remaining / capacity : 0;
        return {
          _id: b._id,
          name: b.name,
          icon: b.icon,
          color: b.color,
          capacityMl: capacity || b.capacityMl,
          isActive: b.isActive,
          isCalibrated: b.fullWeightG > 0,
          consumedMl: consumedFromBottle,
          waterRemainingMl: remaining,
          fillPercentage,
          drinkCount: bottleDrinks.length,
          lastDrinkAt: bottleDrinks.length
            ? Math.max(...bottleDrinks.map((d) => d.timestamp))
            : null,
        };
      }),
    };
  },
});
