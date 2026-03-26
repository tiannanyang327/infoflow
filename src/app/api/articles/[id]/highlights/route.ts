import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { jsonWithCors, corsResponse } from "@/lib/cors";

export async function OPTIONS() {
  return corsResponse();
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUser();

  const [article] = await db
    .select({ metadata: articles.metadata })
    .from(articles)
    .where(and(eq(articles.id, id), eq(articles.userId, user.id)))
    .limit(1);

  const highlights = (article?.metadata as Record<string, unknown>)?.highlights || [];
  return jsonWithCors({ highlights });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUser();
  const { highlights } = await request.json();

  // Get current metadata and merge
  const [article] = await db
    .select({ metadata: articles.metadata })
    .from(articles)
    .where(and(eq(articles.id, id), eq(articles.userId, user.id)))
    .limit(1);

  const currentMeta = (article?.metadata as Record<string, unknown>) || {};

  await db
    .update(articles)
    .set({
      metadata: { ...currentMeta, highlights },
      updatedAt: new Date(),
    })
    .where(and(eq(articles.id, id), eq(articles.userId, user.id)));

  return jsonWithCors({ success: true });
}
