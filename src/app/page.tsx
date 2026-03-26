"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { ArticleCard } from "@/components/article-card";
import { AddArticleDialog } from "@/components/add-article-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Inbox } from "lucide-react";
import type { Article } from "@/lib/db/schema";

interface ArticleWithTags {
  article: Article;
  tags: string[];
}

function InboxContent() {
  const searchParams = useSearchParams();
  const activeTag = searchParams.get("tag");
  const [articles, setArticles] = useState<ArticleWithTags[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeTag) params.set("tag", activeTag);
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/articles?${params}`);
      const data = await res.json();
      setArticles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch articles:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTag, search]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return (
    <div className="flex h-screen w-full">
      <Suspense>
        <Sidebar />
      </Suspense>

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-6 py-4 border-b border-border/50">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight">
                {activeTag ? (
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm">
                      #{activeTag}
                    </Badge>
                  </span>
                ) : (
                  "Inbox"
                )}
              </h1>
              <span className="text-xs text-muted-foreground">
                {articles.length} articles
              </span>
            </div>
          </div>

          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>

          <AddArticleDialog onSuccess={fetchArticles} />
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl bg-muted/50 animate-pulse"
                />
              ))}
            </div>
          ) : articles.length > 0 ? (
            <div className="space-y-2 max-w-3xl">
              {articles.map(({ article, tags }) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  tags={tags}
                  onDelete={() => fetchArticles()}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Inbox className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <h2 className="text-lg font-medium mb-1">
                {activeTag ? `No articles tagged "${activeTag}"` : "Your inbox is empty"}
              </h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {activeTag
                  ? "Try adding content that relates to this topic."
                  : "Paste a URL to get started. AI will automatically summarize, tag, and extract key insights."}
              </p>
              {!activeTag && <AddArticleDialog onSuccess={fetchArticles} />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <InboxContent />
    </Suspense>
  );
}
