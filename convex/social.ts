import { v } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

async function validateToken(ctx: QueryCtx | MutationCtx, token: string): Promise<Id<"users">> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Invalid or expired session");
  }

  return session.userId;
}

export const getFriends = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const userId = await validateToken(ctx, args.token);

    const friendships = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const reverseFriendships = await ctx.db
      .query("friendships")
      .withIndex("by_friend", (q) => q.eq("friendId", userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const friendIds = [
      ...friendships.map((f) => f.friendId),
      ...reverseFriendships.map((f) => f.userId),
    ];

    const friends = await Promise.all(
      friendIds.map(async (id) => {
        const user = await ctx.db.get(id);
        if (!user) return null;

        const streak = await ctx.db
          .query("streaks")
          .withIndex("by_user", (q) => q.eq("userId", id))
          .first();

        return {
          id: user._id,
          name: user.name,
          avatar: user.avatar,
          level: user.level,
          xp: user.xp,
          currentStreak: streak?.currentStreak ?? 0,
        };
      })
    );

    return friends.filter(Boolean);
  },
});

export const getPendingRequests = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const userId = await validateToken(ctx, args.token);

    const requests = await ctx.db
      .query("friendships")
      .withIndex("by_friend", (q) => q.eq("friendId", userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const user = await ctx.db.get(request.userId);
        return {
          id: request._id,
          userId: request.userId,
          name: user?.name ?? "Unknown",
          avatar: user?.avatar,
          createdAt: request.createdAt,
        };
      })
    );

    return requestsWithUsers;
  },
});

export const sendFriendRequest = mutation({
  args: {
    token: v.string(),
    friendEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await validateToken(ctx, args.token);

    const friend = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.friendEmail))
      .first();

    if (!friend) {
      throw new Error("User not found");
    }

    if (friend._id === userId) {
      throw new Error("Cannot send friend request to yourself");
    }

    const existing = await ctx.db
      .query("friendships")
      .withIndex("by_users", (q) =>
        q.eq("userId", userId).eq("friendId", friend._id)
      )
      .first();

    if (existing) {
      throw new Error("Friend request already sent");
    }

    const existingReverse = await ctx.db
      .query("friendships")
      .withIndex("by_users", (q) =>
        q.eq("userId", friend._id).eq("friendId", userId)
      )
      .first();

    if (existingReverse) {
      throw new Error("This user has already sent you a friend request");
    }

    await ctx.db.insert("friendships", {
      userId,
      friendId: friend._id,
      status: "pending",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const acceptFriendRequest = mutation({
  args: {
    token: v.string(),
    requestId: v.id("friendships"),
  },
  handler: async (ctx, args) => {
    const userId = await validateToken(ctx, args.token);

    const request = await ctx.db.get(args.requestId);
    if (!request || request.friendId !== userId) {
      throw new Error("Friend request not found");
    }

    await ctx.db.patch(args.requestId, { status: "accepted" });

    return { success: true };
  },
});

export const rejectFriendRequest = mutation({
  args: {
    token: v.string(),
    requestId: v.id("friendships"),
  },
  handler: async (ctx, args) => {
    const userId = await validateToken(ctx, args.token);

    const request = await ctx.db.get(args.requestId);
    if (!request || request.friendId !== userId) {
      throw new Error("Friend request not found");
    }

    await ctx.db.patch(args.requestId, { status: "rejected" });

    return { success: true };
  },
});

export const removeFriend = mutation({
  args: {
    token: v.string(),
    friendId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await validateToken(ctx, args.token);

    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_users", (q) =>
        q.eq("userId", userId).eq("friendId", args.friendId)
      )
      .first();

    if (friendship) {
      await ctx.db.delete(friendship._id);
      return { success: true };
    }

    const reverseFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_users", (q) =>
        q.eq("userId", args.friendId).eq("friendId", userId)
      )
      .first();

    if (reverseFriendship) {
      await ctx.db.delete(reverseFriendship._id);
      return { success: true };
    }

    throw new Error("Friendship not found");
  },
});

export const getLeaderboard = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const userId = await validateToken(ctx, args.token);

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const friendships = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const reverseFriendships = await ctx.db
      .query("friendships")
      .withIndex("by_friend", (q) => q.eq("friendId", userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const friendIds = [
      userId,
      ...friendships.map((f) => f.friendId),
      ...reverseFriendships.map((f) => f.userId),
    ];

    const leaderboard = await Promise.all(
      friendIds.map(async (id) => {
        const user = await ctx.db.get(id);
        if (!user) return null;

        const logs = await ctx.db
          .query("drinkLogs")
          .withIndex("by_user_and_timestamp", (q) =>
            q.eq("userId", id).gte("timestamp", startOfWeek.getTime())
          )
          .collect();

        const weeklyTotal = logs.reduce((sum, log) => sum + log.amountMl, 0);

        return {
          id: user._id,
          name: user.name,
          avatar: user.avatar,
          level: user.level,
          weeklyTotal,
          isCurrentUser: id === userId,
        };
      })
    );

    return leaderboard
      .filter(Boolean)
      .sort((a, b) => b!.weeklyTotal - a!.weeklyTotal)
      .slice(0, 20);
  },
});

export const getChallenges = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const userId = await validateToken(ctx, args.token);

    const createdChallenges = await ctx.db
      .query("challenges")
      .withIndex("by_creator", (q) => q.eq("creatorId", userId))
      .collect();

    const allChallenges = await ctx.db.query("challenges").collect();
    const participatingChallenges = allChallenges.filter(
      (c) => c.participants.includes(userId) && c.creatorId !== userId
    );

    const challenges = [...createdChallenges, ...participatingChallenges];

    const challengesWithProgress = await Promise.all(
      challenges.map(async (challenge) => {
        const progress = await ctx.db
          .query("challengeProgress")
          .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
          .collect();

        const creator = await ctx.db.get(challenge.creatorId);

        const endDate = new Date(challenge.endDate);
        const now = new Date();
        const daysRemaining = Math.ceil(
          (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          id: challenge._id,
          name: challenge.name,
          description: challenge.description,
          goalMl: challenge.goalMl,
          startDate: challenge.startDate,
          endDate: challenge.endDate,
          daysRemaining: Math.max(0, daysRemaining),
          isActive: daysRemaining > 0,
          creatorName: creator?.name ?? "Unknown",
          participantCount: challenge.participants.length,
          progress: progress.map((p) => ({
            userId: p.userId,
            totalMl: p.totalMl,
          })),
        };
      })
    );

    return challengesWithProgress;
  },
});

export const createChallenge = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    description: v.string(),
    goalMl: v.number(),
    durationDays: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await validateToken(ctx, args.token);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + args.durationDays);

    const challengeId = await ctx.db.insert("challenges", {
      creatorId: userId,
      name: args.name,
      description: args.description,
      goalMl: args.goalMl,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      participants: [userId],
    });

    await ctx.db.insert("challengeProgress", {
      challengeId,
      userId,
      totalMl: 0,
      lastUpdated: Date.now(),
    });

    return { challengeId };
  },
});

export const joinChallenge = mutation({
  args: {
    token: v.string(),
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const userId = await validateToken(ctx, args.token);

    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    if (challenge.participants.includes(userId)) {
      throw new Error("Already participating in this challenge");
    }

    await ctx.db.patch(args.challengeId, {
      participants: [...challenge.participants, userId],
    });

    await ctx.db.insert("challengeProgress", {
      challengeId: args.challengeId,
      userId,
      totalMl: 0,
      lastUpdated: Date.now(),
    });

    return { success: true };
  },
});

export const leaveChallenge = mutation({
  args: {
    token: v.string(),
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const userId = await validateToken(ctx, args.token);

    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    if (challenge.creatorId === userId) {
      throw new Error("Creator cannot leave the challenge");
    }

    await ctx.db.patch(args.challengeId, {
      participants: challenge.participants.filter((p) => p !== userId),
    });

    const progress = await ctx.db
      .query("challengeProgress")
      .withIndex("by_challenge_and_user", (q) =>
        q.eq("challengeId", args.challengeId).eq("userId", userId)
      )
      .first();

    if (progress) {
      await ctx.db.delete(progress._id);
    }

    return { success: true };
  },
});

export const searchUsers = query({
  args: {
    token: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await validateToken(ctx, args.token);

    const users = await ctx.db
      .query("users")
      .withIndex("by_email")
      .collect();

    const searchTerm = args.email.toLowerCase();
    const matchingUsers = users.filter(
      (user) =>
        user.email.toLowerCase().includes(searchTerm) && user._id !== userId
    );

    return matchingUsers.slice(0, 10).map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      level: user.level,
    }));
  },
});
