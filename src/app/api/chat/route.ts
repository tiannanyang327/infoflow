import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY! });
import { streamText } from "ai";
import { getArticleById, getArticles, getOrCreateConversation, addMessage, getConversationMessages } from "@/lib/db/queries";

export async function POST(request: NextRequest) {
  const user = await getUser();

  const { message, contextType, contextId } = await request.json();

  // Get or create conversation
  const conversation = await getOrCreateConversation(user.id, contextType, contextId);

  // Save user message
  await addMessage(conversation.id, "user", message);

  // Build context
  let systemContext = "";

  if (contextType === "article") {
    const article = await getArticleById(contextId, user.id);
    if (article) {
      const content = article.article.content || "";
      const truncated = content.length > 8000 ? content.slice(0, 8000) + "\n[truncated]" : content;
      systemContext = `You are an AI assistant helping analyze a saved article.

Article Title: ${article.article.title}
Author: ${article.article.author || "Unknown"}
Source: ${article.article.sourceType}
Summary: ${article.article.summary || "N/A"}
Key Points: ${(article.article.keyPoints as string[] || []).join("; ")}
Tags: ${(article.tags || []).join(", ")}

Full Content:
${truncated}`;
    }
  } else if (contextType === "tag") {
    const tagArticles = await getArticles(user.id, { tagName: contextId, limit: 20 });
    const summaries = tagArticles
      .filter((a: { article: { summary: string | null } }) => a.article.summary)
      .map((a: { article: { title: string | null; sourceType: string; summary: string | null } }) =>
        `- **${a.article.title}** (${a.article.sourceType}): ${a.article.summary}`
      )
      .join("\n");

    systemContext = `You are an AI assistant helping synthesize insights across multiple articles tagged "${contextId}".

Articles in this topic (${tagArticles.length} total):
${summaries}

Help the user find patterns, contradictions, and insights across these sources.`;
  }

  // Get conversation history
  const history = await getConversationMessages(conversation.id);
  const chatMessages = history.slice(-20).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Stream response
  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    system: systemContext || "You are a helpful AI assistant for a knowledge management tool.",
    messages: chatMessages,
    async onFinish({ text }) {
      await addMessage(conversation.id, "assistant", text);
    },
  });

  return result.toTextStreamResponse();
}
