import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("discussions")
      .order("desc")
      .take(args.limit || 50);
  },
});

export const send = mutation({
  args: {
    text: v.string(),
    userId: v.string(),
    username: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("discussions", args);
  },
});
