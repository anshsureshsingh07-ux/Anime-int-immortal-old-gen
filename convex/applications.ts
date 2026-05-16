import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("applications").order("desc").collect();
  },
});

export const getPendingByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("applications")
      .withIndex("by_user_status", (q) => q.eq("userId", args.userId).eq("status", "pending"))
      .unique();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    age: v.string(),
    discord: v.string(),
    role: v.string(),
    skills: v.string(),
    experience: v.string(),
    availability: v.string(),
    userId: v.string(),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("applications", {
      ...args,
      status: "pending",
    });
  },
});

export const updateStatus = mutation({
  args: { id: v.id("applications"), status: v.string() },
  handler: async (ctx, args) => {
    const app = await ctx.db.get(args.id);
    if (!app) throw new Error("Application not found");

    await ctx.db.patch(args.id, { status: args.status });

    if (args.status === "approved") {
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", app.userId))
        .unique();
      
      if (user) {
        await ctx.db.patch(user._id, { role: app.role });
      }
    }
  },
});
