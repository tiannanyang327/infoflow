"use client";

import { useEffect, useState, use } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChatPanel } from "@/components/chat-panel";
import { HighlightableContent } from "@/components/highlightable-content";
import { getSourceInfo } from "@/lib/source-icons";
import { ArrowLeft, ExternalLink, Clock, User } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { Article } from "@/lib/db/schema";

interface ArticleDetail {
  article: Article;
  tags: string[];
}

export default function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<ArticleDetail | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatInjection, setChatInjection] = useState<string>("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/articles/${id}`).then((r) => r.json()),
      fetch(`/api/articles/${id}/highlights`).then((r) => r.json()).catch(() => ({ highlights: [] })),
    ])
      .then(([articleData, hlData]) => {
        setData(articleData);
        setHighlights(hlData.highlights || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Article not found</p>
      </div>
    );
  }

  const { article, tags } = data;
  const source = getSourceInfo(article.sourceType);
  const keyPoints = (article.keyPoints as string[]) || [];

  // Generate suggested questions based on article content
  const suggestedQuestions = [
    keyPoints[0] ? `「${keyPoints[0].slice(0, 30)}」具体是怎么做的？` : "这篇内容的核心观点是什么？",
    "哪些观点可以应用到我的工作中？",
    tags.length > 0 ? `和 #${tags[0]} 相关的其他文章有什么不同观点？` : "有哪些可以借鉴的做法？",
  ];

  return (
    <div className="flex h-screen">
      {/* Left: Article content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Nav */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-border">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs bg-muted text-muted-foreground">
              {source.emoji} {source.label}
            </span>
            {article.author && (
              <>
                <User className="h-3 w-3" />
                <span>{article.author}</span>
              </>
            )}
            <Clock className="h-3 w-3" />
            <span>
              {article.createdAt
                ? formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })
                : ""}
            </span>
          </div>
          {article.url && !article.url.startsWith("manual://") && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto"
            >
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <ExternalLink className="h-3 w-3" />
                Original
              </Button>
            </a>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 max-w-3xl">
          <h1 className="text-[1.75rem] font-bold tracking-tight leading-[1.2] mb-5">
            {article.title}
          </h1>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-6">
            {tags.map((tag) => (
              <Link key={tag} href={`/?tag=${encodeURIComponent(tag)}`}>
                <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-accent">
                  #{tag}
                </Badge>
              </Link>
            ))}
          </div>

          {/* AI Summary */}
          {article.summary && (
            <div className="bg-[oklch(0.98_0_0)] border border-border rounded-lg p-5 mb-8">
              <p className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-widest mb-2">
                AI Summary
              </p>
              <p className="text-sm leading-relaxed">{article.summary}</p>
            </div>
          )}

          {/* Key Points */}
          {keyPoints.length > 0 && (
            <div className="mb-6">
              <p className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-widest mb-3">
                Key Points
              </p>
              <ul className="space-y-2">
                {keyPoints.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-foreground text-background text-[10px] flex items-center justify-center font-semibold">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Highlights section */}
          {highlights.length > 0 && (
            <div className="mb-8 bg-[oklch(0.98_0_0)] border border-border rounded-lg p-5">
              <p className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-widest mb-3">
                My Highlights · {highlights.length}
              </p>
              <ul className="space-y-2.5">
                {highlights.map((hl, i) => (
                  <li key={i} className="flex gap-2.5 text-sm">
                    <span className="flex-shrink-0 w-1 rounded-full bg-foreground mt-1" style={{ minHeight: 16 }} />
                    <span className="leading-relaxed">{hl}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator className="my-6" />

          {/* Original content with highlighting */}
          {article.content && (
            <div>
              <p className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-widest mb-3">
                Original Content
                <span className="ml-2 font-normal normal-case tracking-normal">— 选中文字可高亮</span>
              </p>
              <HighlightableContent
                content={article.content}
                articleId={id}
                highlights={highlights}
                onHighlightsChange={setHighlights}
                onSendToChat={(text) => setChatInjection(text)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right: Chat panel — fixed height, internal scroll */}
      <div className="w-96 border-l border-border flex-shrink-0 h-screen sticky top-0">
        <ChatPanel
          contextType="article"
          contextId={id}
          placeholder="Ask anything about this article..."
          injectedMessage={chatInjection}
          onInjectedMessageHandled={() => setChatInjection("")}
          suggestedQuestions={suggestedQuestions}
        />
      </div>
    </div>
  );
}
