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

export const create = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    capacityMl: v.number(),
    emptyWeightG: v.number(),
    fullWeightG: v.number(),
    bleDeviceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await validateSession(ctx, args.token);

    const bottleId = await ctx.db.insert("bottles", {
      userId,
      name: args.name,
      icon: args.icon,
      color: args.color,
      capacityMl: args.capacityMl,
      emptyWeightG: args.emptyWeightG,
      fullWeightG: args.fullWeightG,
      bleDeviceId: args.bleDeviceId,
      isActive: true,
      createdAt: Date.now(),
    });

    return bottleId;
  },
});

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

    return await ctx.db
      .query("bottles")
      .withIndex("by_user", (q) => q.eq("userId", session.userId))
      .collect();
  },
});

export const get = query({
  args: {
    token: v.string(),
    bottleId: v.id("bottles"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const bottle = await ctx.db.get(args.bottleId);

    if (!bottle || bottle.userId !== session.userId) {
      return null;
    }

    return bottle;
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    bottleId: v.id("bottles"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    capacityMl: v.optional(v.number()),
    emptyWeightG: v.optional(v.number()),
    fullWeightG: v.optional(v.number()),
    bleDeviceId: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await validateSession(ctx, args.token);

    const bottle = await ctx.db.get(args.bottleId);
    if (!bottle || bottle.userId !== userId) {
      throw new Error("Bottle not found");
    }

    const { token, bottleId, ...updates } = args;
    await ctx.db.patch(bottleId, updates);

    return { success: true };
  },
});

export const remove = mutation({
  args: {
    token: v.string(),
    bottleId: v.id("bottles"),
  },
  handler: async (ctx, args) => {
    const userId = await validateSession(ctx, args.token);

    const bottle = await ctx.db.get(args.bottleId);
    if (!bottle || bottle.userId !== userId) {
      throw new Error("Bottle not found");
    }

    await ctx.db.delete(args.bottleId);

    return { success: true };
  },
});

export const updateLiveWeight = mutation({
  args: {
    token: v.string(),
    bottleId: v.id("bottles"),
    weightG: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await validateSession(ctx, args.token);
    const bottle = await ctx.db.get(args.bottleId);
    if (!bottle || bottle.userId !== userId) {
      return { success: false };
    }
    await ctx.db.patch(args.bottleId, {
      lastWeightG: args.weightG,
      lastWeightAt: Date.now(),
    });
    return { success: true };
  },
});

export const calculateWaterLevel = query({
  args: {
    bottleId: v.id("bottles"),
    currentWeightG: v.number(),
  },
  handler: async (ctx, args) => {
    const bottle = await ctx.db.get(args.bottleId);
    if (!bottle) {
      return null;
    }

    const waterWeightG = args.currentWeightG - bottle.emptyWeightG;
    const maxWaterWeightG = bottle.fullWeightG - bottle.emptyWeightG;

    const currentMl = Math.max(0, Math.round(waterWeightG));
    const percentage = Math.min(100, Math.max(0, (waterWeightG / maxWaterWeightG) * 100));

    return {
      currentMl,
      totalMl: bottle.capacityMl,
      percentage: Math.round(percentage),
    };
  },
});
