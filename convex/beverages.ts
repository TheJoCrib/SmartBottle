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

    const defaults = await ctx.db
      .query("beverageTypes")
      .withIndex("by_default", (q) => q.eq("isDefault", true))
      .collect();

    const custom = await ctx.db
      .query("beverageTypes")
      .withIndex("by_user", (q) => q.eq("userId", session.userId))
      .collect();

    return [...defaults, ...custom];
  },
});

export const create = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    icon: v.string(),
    caffeineContent: v.optional(v.number()),
    calories: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await validateSession(ctx, args.token);

    const beverageId = await ctx.db.insert("beverageTypes", {
      name: args.name,
      icon: args.icon,
      isDefault: false,
      userId,
      caffeineContent: args.caffeineContent,
      calories: args.calories,
    });

    return beverageId;
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    beverageId: v.id("beverageTypes"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
    caffeineContent: v.optional(v.number()),
    calories: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await validateSession(ctx, args.token);

    const beverage = await ctx.db.get(args.beverageId);
    if (!beverage || beverage.userId !== userId) {
      throw new Error("Beverage not found or not owned by user");
    }

    const { token, beverageId, ...updates } = args;
    await ctx.db.patch(beverageId, updates);

    return { success: true };
  },
});

export const remove = mutation({
  args: {
    token: v.string(),
    beverageId: v.id("beverageTypes"),
  },
  handler: async (ctx, args) => {
    const userId = await validateSession(ctx, args.token);

    const beverage = await ctx.db.get(args.beverageId);
    if (!beverage || beverage.userId !== userId) {
      throw new Error("Beverage not found or not owned by user");
    }

    if (beverage.isDefault) {
      throw new Error("Cannot delete default beverage types");
    }

    await ctx.db.delete(args.beverageId);

    return { success: true };
  },
});

export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("beverageTypes")
      .withIndex("by_default", (q) => q.eq("isDefault", true))
      .first();

    if (existing) {
      return { message: "Defaults already seeded" };
    }

    const defaults = [
      { name: "Water", icon: "💧", caffeineContent: 0, calories: 0 },
      { name: "Coffee", icon: "☕", caffeineContent: 95, calories: 2 },
      { name: "Tea", icon: "🍵", caffeineContent: 47, calories: 2 },
      { name: "Green Tea", icon: "🍃", caffeineContent: 28, calories: 0 },
      { name: "Sparkling Water", icon: "🫧", caffeineContent: 0, calories: 0 },
      { name: "Lemon Water", icon: "🍋", caffeineContent: 0, calories: 5 },
      { name: "Coconut Water", icon: "🥥", caffeineContent: 0, calories: 19 },
      { name: "Sports Drink", icon: "⚡", caffeineContent: 0, calories: 21 },
      { name: "Juice", icon: "🧃", caffeineContent: 0, calories: 45 },
      { name: "Smoothie", icon: "🥤", caffeineContent: 0, calories: 60 },
      { name: "Milk", icon: "🥛", caffeineContent: 0, calories: 42 },
      { name: "Herbal Tea", icon: "🌿", caffeineContent: 0, calories: 0 },
    ];

    for (const beverage of defaults) {
      await ctx.db.insert("beverageTypes", {
        ...beverage,
        isDefault: true,
      });
    }

    return { message: "Defaults seeded successfully" };
  },
});
