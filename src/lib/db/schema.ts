import { pgTable, uuid, text, timestamp, boolean, real, jsonb, primaryKey } from "drizzle-orm/pg-core";

export const articles = pgTable("articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  url: text("url").notNull(),
  sourceType: text("source_type").notNull(), // 'twitter', 'newsletter', 'xiaohongshu', 'wechat', 'web'
  title: text("title"),
  author: text("author"),
  content: text("content"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  summary: text("summary"),
  keyPoints: jsonb("key_points").$type<string[]>(),
  language: text("language"), // 'zh', 'en', 'mixed'
  status: text("status").notNull().default("pending"), // 'pending', 'processed', 'failed'
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  color: text("color"),
  isAiGenerated: boolean("is_ai_generated").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const articleTags = pgTable(
  "article_tags",
  {
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    confidence: real("confidence"),
  },
  (t) => [primaryKey({ columns: [t.articleId, t.tagId] })]
);

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  contextType: text("context_type").notNull(), // 'article', 'tag'
  contextId: text("context_id").notNull(), // article UUID or tag name
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user', 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  articleId: uuid("article_id").references(() => articles.id, { onDelete: "cascade" }),
  tagName: text("tag_name"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Type exports
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Note = typeof notes.$inferSelect;
