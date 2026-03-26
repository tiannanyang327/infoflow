import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getNote, upsertNote } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const user = await getUser();

  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get("articleId") || undefined;
  const tagName = searchParams.get("tagName") || undefined;

  const note = await getNote(user.id, articleId, tagName);
  return NextResponse.json(note || { content: "" });
}

export async function POST(request: NextRequest) {
  const user = await getUser();

  const { articleId, tagName, content } = await request.json();

  const note = await upsertNote({
    userId: user.id,
    articleId,
    tagName,
    content,
  });

  return NextResponse.json(note);
}
