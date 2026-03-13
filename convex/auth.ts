import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "smartbottle_salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

function calculateRecommendedIntake(
  weight: number,
  activityLevel: string
): number {
  const baseIntake = weight * 33;

  const multipliers: Record<string, number> = {
    sedentary: 1.0,
    light: 1.1,
    moderate: 1.2,
    active: 1.3,
    very_active: 1.5,
  };

  const multiplier = multipliers[activityLevel] || 1.0;
  return Math.round(baseIntake * multiplier);
}

export const register = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (existingUser) {
      throw new Error("Email already registered");
    }

    const passwordHash = await hashPassword(args.password);

    const userId = await ctx.db.insert("users", {
      email: args.email.toLowerCase(),
      passwordHash,
      name: args.name,
      dailyGoalMl: 2000,
      customGoal: false,
      xp: 0,
      level: 1,
      createdAt: Date.now(),
    });

    await ctx.db.insert("streaks", {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: "",
    });

    const token = generateToken();
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

    await ctx.db.insert("sessions", {
      userId,
      token,
      expiresAt,
      createdAt: Date.now(),
    });

    return { userId, token };
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const passwordHash = await hashPassword(args.password);
    if (user.passwordHash !== passwordHash) {
      throw new Error("Invalid email or password");
    }

    const token = generateToken();
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt,
      createdAt: Date.now(),
    });

    return { userId: user._id, token };
  },
});

export const logout = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

export const validateSession = query({
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
    if (!user) {
      return null;
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
});

export const updateProfile = mutation({
  args: {
    token: v.string(),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    height: v.optional(v.number()),
    weight: v.optional(v.number()),
    age: v.optional(v.number()),
    gender: v.optional(
      v.union(v.literal("male"), v.literal("female"), v.literal("other"))
    ),
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
    dailyGoalMl: v.optional(v.number()),
    customGoal: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid session");
    }

    const { token, ...updates } = args;

    if (!args.customGoal && (args.weight || args.activityLevel)) {
      const user = await ctx.db.get(session.userId);
      if (user) {
        const weight = args.weight || user.weight || 70;
        const activityLevel = args.activityLevel || user.activityLevel || "moderate";
        updates.dailyGoalMl = calculateRecommendedIntake(weight, activityLevel);
      }
    }

    await ctx.db.patch(session.userId, updates);

    return { success: true };
  },
});

export const getRecommendedIntake = query({
  args: {
    weight: v.number(),
    activityLevel: v.string(),
  },
  handler: async (ctx, args) => {
    return calculateRecommendedIntake(args.weight, args.activityLevel);
  },
});
