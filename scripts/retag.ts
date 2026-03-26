import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and } from "drizzle-orm";
import { articles, tags, articleTags } from "../src/lib/db/schema";
import { extractArticleInfo } from "../src/lib/ai";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client);

const USER_ID = "dev-user-001";

async function main() {
  // 1. Fetch all articles
  const allArticles = await db
    .select({ id: articles.id, title: articles.title, content: articles.content })
    .from(articles)
    .where(eq(articles.userId, USER_ID));

  console.log(`Found ${allArticles.length} articles to retag\n`);

  for (const article of allArticles) {
    const title = article.title || "Untitled";
    console.log(`Processing: ${title.slice(0, 50)}...`);

    // 2. Delete old article_tags for this article
    await db.delete(articleTags).where(eq(articleTags.articleId, article.id));

    // 3. Get current user tags (refreshed each iteration so new tags are available)
    const userTags = await db
      .select({ name: tags.name })
      .from(tags)
      .where(eq(tags.userId, USER_ID));
    const existingTagNames = userTags.map((t) => t.name);

    // 4. Re-extract with updated prompt
    const extraction = await extractArticleInfo(
      article.content || "",
      title,
      existingTagNames
    );

    // 5. Update article summary/keyPoints too
    await db
      .update(articles)
      .set({
        summary: extraction.summary,
        keyPoints: extraction.keyPoints,
        language: extraction.language,
        updatedAt: new Date(),
      })
      .where(eq(articles.id, article.id));

    // 6. Upsert tags and link
    for (const tagName of extraction.tags) {
      const existing = await db
        .select()
        .from(tags)
        .where(and(eq(tags.userId, USER_ID), eq(tags.name, tagName)))
        .limit(1);

      let tagId: string;
      if (existing.length > 0) {
        tagId = existing[0].id;
      } else {
        const [newTag] = await db
          .insert(tags)
          .values({ userId: USER_ID, name: tagName, isAiGenerated: true })
          .returning();
        tagId = newTag.id;
      }

      await db
        .insert(articleTags)
        .values({ articleId: article.id, tagId })
        .onConflictDoNothing();
    }

    console.log(`  → tags: [${extraction.tags.join(", ")}]\n`);
  }

  // 7. Clean up orphan tags (no articles linked)
  const orphanTags = await db.execute<{ id: string; name: string }>(
    `DELETE FROM tags WHERE id NOT IN (SELECT DISTINCT tag_id FROM article_tags) AND user_id = '${USER_ID}' RETURNING name`
  );
  if (orphanTags.length > 0) {
    console.log(`Cleaned orphan tags: ${orphanTags.map((t: { name: string }) => t.name).join(", ")}`);
  }

  console.log("\nDone!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
