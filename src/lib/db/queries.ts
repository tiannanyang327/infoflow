import { db } from "./index";
import { articles, tags, articleTags, conversations, messages, notes } from "./schema";
import { eq, desc, and, ilike, sql, inArray } from "drizzle-orm";
import type { AIExtraction } from "../ai";

// ── Articles ──

export async function createArticle(data: {
  userId: string;
  url: string;
  sourceType: string;
  title: string;
  author: string;
  content: string;
  publishedAt?: string;
}) {
  const [article] = await db
    .insert(articles)
    .values({
      userId: data.userId,
      url: data.url,
      sourceType: data.sourceType,
      title: data.title,
      author: data.author,
      content: data.content,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      status: "pending",
    })
    .returning();
  return article;
}

export async function updateArticleWithAI(
  articleId: string,
  userId: string,
  extraction: AIExtraction
) {
  // Update article with AI results
  await db
    .update(articles)
    .set({
      summary: extraction.summary,
      keyPoints: extraction.keyPoints,
      language: extraction.language,
      status: "processed",
      updatedAt: new Date(),
    })
    .where(eq(articles.id, articleId));

  // Create or find tags, then link
  for (const tagName of extraction.tags) {
    // Upsert tag
    const existingTag = await db
      .select()
      .from(tags)
      .where(and(eq(tags.userId, userId), eq(tags.name, tagName)))
      .limit(1);

    let tagId: string;
    if (existingTag.length > 0) {
      tagId = existingTag[0].id;
    } else {
      const [newTag] = await db
        .insert(tags)
        .values({ userId, name: tagName, isAiGenerated: true })
        .returning();
      tagId = newTag.id;
    }

    // Link article to tag (ignore duplicate)
    await db
      .insert(articleTags)
      .values({ articleId, tagId })
      .onConflictDoNothing();
  }
}

export async function getArticles(userId: string, options?: {
  tagName?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  // Build where conditions upfront
  const conditions = [eq(articles.userId, userId)];

  if (options?.tagName) {
    const articleIdsWithTag = db
      .select({ articleId: articleTags.articleId })
      .from(articleTags)
      .innerJoin(tags, eq(articleTags.tagId, tags.id))
      .where(and(eq(tags.name, options.tagName), eq(tags.userId, userId)));

    conditions.push(inArray(articles.id, articleIdsWithTag));
  }

  if (options?.search) {
    conditions.push(
      sql`(${articles.title} ILIKE ${"%" + options.search + "%"} OR ${articles.summary} ILIKE ${"%" + options.search + "%"})`
    );
  }

  return db
    .select({
      article: articles,
      tags: sql<string[]>`COALESCE(array_agg(DISTINCT ${tags.name}) FILTER (WHERE ${tags.name} IS NOT NULL), '{}')`.as("tags"),
    })
    .from(articles)
    .leftJoin(articleTags, eq(articles.id, articleTags.articleId))
    .leftJoin(tags, eq(articleTags.tagId, tags.id))
    .where(and(...conditions))
    .groupBy(articles.id)
    .orderBy(desc(articles.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getArticleById(articleId: string, userId: string) {
  const result = await db
    .select({
      article: articles,
      tags: sql<string[]>`COALESCE(array_agg(DISTINCT ${tags.name}) FILTER (WHERE ${tags.name} IS NOT NULL), '{}')`.as("tags"),
    })
    .from(articles)
    .leftJoin(articleTags, eq(articles.id, articleTags.articleId))
    .leftJoin(tags, eq(articleTags.tagId, tags.id))
    .where(and(eq(articles.id, articleId), eq(articles.userId, userId)))
    .groupBy(articles.id)
    .limit(1);

  return result[0] || null;
}

export async function deleteArticle(articleId: string, userId: string) {
  await db
    .delete(articles)
    .where(and(eq(articles.id, articleId), eq(articles.userId, userId)));
}

// ── Tags ──

export async function getUserTags(userId: string) {
  const result = await db
    .select({
      tag: tags,
      count: sql<number>`COUNT(${articleTags.articleId})::int`.as("count"),
    })
    .from(tags)
    .leftJoin(articleTags, eq(tags.id, articleTags.tagId))
    .where(eq(tags.userId, userId))
    .groupBy(tags.id)
    .orderBy(sql`count DESC`);

  return result;
}

export async function getUserTagNames(userId: string): Promise<string[]> {
  const result = await db
    .select({ name: tags.name })
    .from(tags)
    .where(eq(tags.userId, userId));
  return result.map((t) => t.name);
}

// ── Conversations ──

export async function getOrCreateConversation(
  userId: string,
  contextType: string,
  contextId: string
) {
  const existing = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.userId, userId),
        eq(conversations.contextType, contextType),
        eq(conversations.contextId, contextId)
      )
    )
    .limit(1);

  if (existing.length > 0) return existing[0];

  const [conv] = await db
    .insert(conversations)
    .values({ userId, contextType, contextId })
    .returning();
  return conv;
}

export async function getConversationMessages(conversationId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
}

export async function addMessage(
  conversationId: string,
  role: string,
  content: string
) {
  const [msg] = await db
    .insert(messages)
    .values({ conversationId, role, content })
    .returning();
  return msg;
}

// ── Notes ──

export async function getNote(userId: string, articleId?: string, tagName?: string) {
  const conditions = [eq(notes.userId, userId)];
  if (articleId) conditions.push(eq(notes.articleId, articleId));
  if (tagName) conditions.push(eq(notes.tagName, tagName));

  const result = await db
    .select()
    .from(notes)
    .where(and(...conditions))
    .limit(1);

  return result[0] || null;
}

export async function upsertNote(data: {
  userId: string;
  articleId?: string;
  tagName?: string;
  content: string;
}) {
  const existing = await getNote(data.userId, data.articleId, data.tagName);

  if (existing) {
    await db
      .update(notes)
      .set({ content: data.content, updatedAt: new Date() })
      .where(eq(notes.id, existing.id));
    return { ...existing, content: data.content };
  }

  const [note] = await db
    .insert(notes)
    .values({
      userId: data.userId,
      articleId: data.articleId || null,
      tagName: data.tagName || null,
      content: data.content,
    })
    .returning();
  return note;
}
