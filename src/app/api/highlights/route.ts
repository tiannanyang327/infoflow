import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { jsonWithCors, corsResponse } from "@/lib/cors";
import { db } from "@/lib/db";
import { articles, tags, articleTags } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

export async function OPTIONS() {
  return corsResponse();
}

export async function GET(request: NextRequest) {
  const user = await getUser();
  const { searchParams } = new URL(request.url);
  const tagFilter = searchParams.get("tag") || undefined;

  // Fetch all articles with their keyPoints and tags
  const results = await db
    .select({
      id: articles.id,
      title: articles.title,
      sourceType: articles.sourceType,
      keyPoints: articles.keyPoints,
      createdAt: articles.createdAt,
      tags: sql<string[]>`COALESCE(array_agg(DISTINCT ${tags.name}) FILTER (WHERE ${tags.name} IS NOT NULL), '{}')`.as("tags"),
    })
    .from(articles)
    .leftJoin(articleTags, eq(articles.id, articleTags.articleId))
    .leftJoin(tags, eq(articleTags.tagId, tags.id))
    .where(
      tagFilter
        ? and(
            eq(articles.userId, user.id),
            sql`${articles.id} IN (
              SELECT ${articleTags.articleId} FROM ${articleTags}
              INNER JOIN ${tags} ON ${articleTags.tagId} = ${tags.id}
              WHERE ${tags.name} = ${tagFilter} AND ${tags.userId} = ${user.id}
            )`
          )
        : eq(articles.userId, user.id)
    )
    .groupBy(articles.id)
    .orderBy(desc(articles.createdAt));

  // Filter out articles without keyPoints
  const highlights = results
    .filter((r) => r.keyPoints && (r.keyPoints as string[]).length > 0)
    .map((r) => ({
      articleId: r.id,
      title: r.title,
      sourceType: r.sourceType,
      createdAt: r.createdAt,
      tags: r.tags,
      keyPoints: r.keyPoints as string[],
    }));

  return jsonWithCors(highlights);
}
