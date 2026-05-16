import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Public query to fetch all news items.
 */
export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    return await ctx.db
      .query("news")
      .order("desc")
      .take(limit);
  },
});

/**
 * Mutation to create a news article.
 */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    image: v.optional(v.string()),
    authorId: v.string(),
    authorName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("news", {
      ...args,
      likesCount: 0,
      commentsCount: 0,
    });
  },
});

/**
 * Mutation to remove a news article.
 */
export const remove = mutation({
  args: { id: v.id("news") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
