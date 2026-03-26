import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { fetchContent, createManualContent } from "@/lib/ingestion";
import { extractArticleInfo } from "@/lib/ai";
import { createArticle, updateArticleWithAI, getArticles, getUserTagNames, upsertNote } from "@/lib/db/queries";
import { corsHeaders, corsResponse, jsonWithCors } from "@/lib/cors";

export async function OPTIONS() {
  return corsResponse();
}

export async function GET(request: NextRequest) {
  const user = await getUser();

  const { searchParams } = new URL(request.url);
  const tagName = searchParams.get("tag") || undefined;
  const search = searchParams.get("search") || undefined;

  const results = await getArticles(user.id, { tagName, search });
  return jsonWithCors(results);
}

export async function POST(request: NextRequest) {
  const user = await getUser();

  const body = await request.json();
  const { url, manualText, manualTitle, contentHtml } = body;

  try {
    let extracted;
    if (manualText) {
      extracted = createManualContent(manualText, manualTitle || "Manual Entry", url);
    } else if (url) {
      extracted = await fetchContent(url);
    } else {
      return jsonWithCors({ error: "URL or manual text required" }, 400);
    }

    const article = await createArticle({
      userId: user.id,
      url: extracted.url,
      sourceType: extracted.sourceType,
      title: extracted.title,
      author: extracted.author,
      content: extracted.content,
      publishedAt: extracted.publishedAt,
    });

    const existingTags = await getUserTagNames(user.id);
    const aiResult = await extractArticleInfo(extracted.content, extracted.title, existingTags);

    await updateArticleWithAI(article.id, user.id, aiResult);

    // Save original content (with HTML/images if available) as note
    const noteContent = contentHtml || extracted.content;
    if (noteContent) {
      await upsertNote({
        userId: user.id,
        articleId: article.id,
        content: noteContent,
      });
    }

    return jsonWithCors({
      id: article.id,
      title: extracted.title,
      summary: aiResult.summary,
      tags: aiResult.tags,
      keyPoints: aiResult.keyPoints,
      status: "processed",
    });
  } catch (error) {
    console.error("Article creation failed:", error);
    return jsonWithCors(
      { error: error instanceof Error ? error.message : "Failed to process content" },
      500
    );
  }
}
