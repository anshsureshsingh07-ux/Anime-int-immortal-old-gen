import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByToken = query({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();
  },
});

export const store = mutation({
  args: {
    username: v.string(),
    email: v.string(),
    avatar: v.optional(v.string()),
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        username: args.username,
        avatar: args.avatar,
      });
      return existing._id;
    }

    const userCount = (await ctx.db.query("users").collect()).length;

    return await ctx.db.insert("users", {
      ...args,
      role: userCount === 0 ? "admin" : "user",
    });
  },
});

export const updateRole = mutation({
  args: { userId: v.id("users"), role: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { role: args.role });
  },
});
