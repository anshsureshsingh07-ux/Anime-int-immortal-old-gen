import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(), // For auth integration
    username: v.string(),
    email: v.string(),
    avatar: v.optional(v.string()),
    role: v.string(), // "admin", "news_writer", "moderator", "user"
  }).index("by_token", ["tokenIdentifier"]),

  news: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.string(),
    image: v.optional(v.string()),
    authorId: v.string(),
    authorName: v.string(),
    likesCount: v.number(),
    commentsCount: v.number(),
  }),

  discussions: defineTable({
    text: v.string(),
    userId: v.string(),
    username: v.string(),
    avatar: v.optional(v.string()),
  }),

  applications: defineTable({
    name: v.string(),
    age: v.string(),
    discord: v.string(),
    role: v.string(),
    skills: v.string(),
    experience: v.string(),
    availability: v.string(),
    userId: v.string(),
    userEmail: v.string(),
    status: v.string(), // "pending", "approved", "rejected"
  }).index("by_user_status", ["userId", "status"]),

  anime: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    mal_id: v.optional(v.number()),
  }),
});
