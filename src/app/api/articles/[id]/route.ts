import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getArticleById, deleteArticle } from "@/lib/db/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUser();

  const result = await getArticleById(id, user.id);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(result);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUser();

  await deleteArticle(id, user.id);
  return NextResponse.json({ success: true });
}
