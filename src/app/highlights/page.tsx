"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import { Badge } from "@/components/ui/badge";
import { Highlighter, ArrowLeft } from "lucide-react";
import { getSourceInfo } from "@/lib/source-icons";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface HighlightArticle {
  articleId: string;
  title: string;
  sourceType: string;
  createdAt: string;
  tags: string[];
  keyPoints: string[];
}

// Color palette for roundtable participants
const avatarColors = [
  "bg-muted",
  "bg-muted",
  "bg-muted",
  "bg-muted",
  "bg-muted",
  "bg-muted",
];

function HighlightsContent() {
  const [articles, setArticles] = useState<HighlightArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);

  const fetchHighlights = useCallback(async (tag?: string) => {
    setLoading(true);
    try {
      const params = tag ? `?tag=${encodeURIComponent(tag)}` : "";
      const res = await fetch(`/api/highlights${params}`);
      const data = await res.json();
      setArticles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch highlights:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all highlights on mount
  useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);

  // Collect all unique tags
  useEffect(() => {
    const tagSet = new Set<string>();
    articles.forEach((a) => a.tags.forEach((t) => tagSet.add(t)));
    setAllTags(Array.from(tagSet).sort());
  }, [articles]);

  const handleTagClick = (tag: string | null) => {
    setActiveTopic(tag);
    if (tag) {
      fetchHighlights(tag);
    } else {
      fetchHighlights();
    }
  };

  const totalHighlights = articles.reduce(
    (sum, a) => sum + a.keyPoints.length,
    0
  );

  // Group articles by source for roundtable avatar colors
  const articleColorMap = new Map<string, string>();
  articles.forEach((a, i) => {
    if (!articleColorMap.has(a.articleId)) {
      articleColorMap.set(a.articleId, avatarColors[i % avatarColors.length]);
    }
  });

  return (
    <div className="flex h-screen w-full">
      <Suspense>
        <Sidebar />
      </Suspense>

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Highlighter className="h-4 w-4 text-muted-foreground" />
            <h1 className="text-lg font-semibold tracking-tight">Highlights</h1>
            <span className="text-xs text-muted-foreground">
              {totalHighlights} insights · {articles.length} articles
            </span>
          </div>
        </header>

        {/* Tag chips */}
        <div className="flex gap-1.5 px-6 py-3 flex-wrap border-b border-border">
          <button
            onClick={() => handleTagClick(null)}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              !activeTopic
                ? "bg-foreground text-background"
                : "border border-border bg-transparent text-muted-foreground hover:text-foreground hover:border-foreground/30"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                activeTopic === tag
                  ? "bg-foreground text-background"
                  : "border border-border bg-transparent text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-3 max-w-2xl">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl bg-muted/50 animate-pulse"
                />
              ))}
            </div>
          ) : activeTopic ? (
            <RoundtableView
              articles={articles}
              topic={activeTopic}
              colorMap={articleColorMap}
              onBack={() => handleTagClick(null)}
            />
          ) : (
            <NoteFlowView articles={articles} />
          )}
        </div>
      </main>
    </div>
  );
}

/** 极简笔记流 — All view */
function NoteFlowView({ articles }: { articles: HighlightArticle[] }) {
  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Highlighter className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <h2 className="text-lg font-medium mb-1">No highlights yet</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Add articles to your inbox — AI will extract key insights
          automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      {articles.map((article) => {
        const source = getSourceInfo(article.sourceType);
        return (
          <div key={article.articleId}>
            {/* Article group header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[11px] bg-muted">
                {source.emoji}
              </span>
              <Link
                href={`/article/${article.articleId}`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate"
              >
                {article.title || "Untitled"}
              </Link>
              <span className="text-[11px] text-muted-foreground/60 ml-auto flex-shrink-0">
                {article.createdAt
                  ? formatDistanceToNow(new Date(article.createdAt), {
                      addSuffix: true,
                    })
                  : ""}
              </span>
            </div>

            {/* Highlights */}
            {article.keyPoints.map((point, i) => (
              <div key={i} className="flex gap-3 py-2">
                <div className="w-[2px] rounded-full bg-foreground/20 flex-shrink-0" />
                <div>
                  <p className="text-sm leading-relaxed text-foreground/85">
                    {point}
                  </p>
                  <div className="flex gap-1 mt-1.5">
                    {article.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 h-4 font-normal"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/** 圆桌讨论 — Topic view */
function RoundtableView({
  articles,
  topic,
  colorMap,
  onBack,
}: {
  articles: HighlightArticle[];
  topic: string;
  colorMap: Map<string, string>;
  onBack: () => void;
}) {
  // Flatten all highlights with source info
  const voices = articles.flatMap((a) =>
    a.keyPoints.map((point) => ({
      articleId: a.articleId,
      title: a.title || "Untitled",
      sourceType: a.sourceType,
      createdAt: a.createdAt,
      text: point,
      color: colorMap.get(a.articleId) || avatarColors[0],
    }))
  );

  // Unique participants
  const participants = Array.from(
    new Map(
      articles.map((a) => [
        a.articleId,
        {
          title: a.title || "Untitled",
          emoji: getSourceInfo(a.sourceType).emoji,
          color: colorMap.get(a.articleId) || avatarColors[0],
        },
      ])
    ).values()
  );

  // Connection labels between voices from different articles
  const connectionLabels = ["进一步延伸", "不同视角", "底层共识", "另一个角度", "相互印证"];

  return (
    <div className="max-w-2xl">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="h-3 w-3" />
        返回全部
      </button>

      {/* Roundtable banner */}
      <div className="bg-[oklch(0.98_0_0)] border border-border rounded-lg p-6 mb-8">
        <p className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-widest mb-1">
          # {topic}
        </p>
        <h2 className="text-base font-semibold tracking-tight">
          {voices.length} insights from {participants.length}{" "}
          {participants.length === 1 ? "article" : "articles"}
        </h2>
        <div className="flex items-center gap-1 mt-3">
          {participants.map((p, i) => (
            <span
              key={i}
              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${p.color} ${i > 0 ? "-ml-1" : ""} ring-2 ring-background`}
            >
              {p.emoji}
            </span>
          ))}
          <span className="text-[11px] text-muted-foreground ml-1">
            {participants.map((p) => p.title.slice(0, 15)).join(" · ")}
          </span>
        </div>
      </div>

      {/* Thread */}
      <div>
        {voices.map((voice, i) => {
          const source = getSourceInfo(voice.sourceType);
          const prevVoice = i > 0 ? voices[i - 1] : null;
          const showConnection =
            prevVoice && prevVoice.articleId !== voice.articleId;

          return (
            <div key={i}>
              {/* Connection line between different sources */}
              {showConnection && (
                <div className="pl-10 py-1">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground/50">
                    <span className="w-4 h-px bg-border" />
                    <span>{connectionLabels[i % connectionLabels.length]}</span>
                    <span className="flex-1 h-px bg-border" />
                  </div>
                </div>
              )}

              <div className="flex gap-3 py-3 border-t border-border/20 first:border-t-0">
                <span
                  className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm ${voice.color}`}
                >
                  {source.emoji}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/article/${voice.articleId}`}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {voice.title}
                    </Link>
                    <span className="text-[10px] text-muted-foreground/50">
                      {voice.createdAt
                        ? formatDistanceToNow(new Date(voice.createdAt), {
                            addSuffix: true,
                          })
                        : ""}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/85">
                    {voice.text}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HighlightsPage() {
  return (
    <Suspense>
      <HighlightsContent />
    </Suspense>
  );
}
