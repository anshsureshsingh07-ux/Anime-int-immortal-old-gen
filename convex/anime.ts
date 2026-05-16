import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { paginationOpts: v.any() }, // Using pagination pattern
  handler: async (ctx, args) => {
    return await ctx.db.query("anime").paginate(args.paginationOpts);
  },
});

export const listAll = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
      return await ctx.db.query("anime").take(args.limit || 100);
    }
});
