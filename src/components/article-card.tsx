"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getSourceInfo } from "@/lib/source-icons";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import type { Article } from "@/lib/db/schema";

interface ArticleCardProps {
  article: Article;
  tags: string[];
  onDelete?: (id: string) => void;
}

export function ArticleCard({ article, tags, onDelete }: ArticleCardProps) {
  const source = getSourceInfo(article.sourceType);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("确定删除这篇文章？")) return;

    setDeleting(true);
    try {
      await fetch(`/api/articles/${article.id}`, { method: "DELETE" });
      onDelete?.(article.id);
    } catch (err) {
      console.error("Failed to delete article:", err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Link href={`/article/${article.id}`} className="block group">
      <div className="p-4 rounded-lg border border-border bg-card hover:bg-[oklch(0.985_0_0)] transition-all duration-150 relative">
        <div className="flex items-start gap-3">
          {/* Source indicator */}
          <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center text-sm">
            {source.emoji}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="font-medium text-[13px] leading-snug line-clamp-2 pr-6">
              {article.title || "Untitled"}
            </h3>

            {/* Summary */}
            {article.summary && (
              <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {article.summary}
              </p>
            )}

            {/* Tags + meta */}
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              {tags.slice(0, 4).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[10px] px-2 py-0 h-[18px] font-normal rounded-sm bg-muted border-0"
                >
                  {tag}
                </Badge>
              ))}
              <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">
                {article.createdAt
                  ? formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })
                  : ""}
              </span>
            </div>
          </div>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="absolute top-3 right-3 p-1.5 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            title="删除文章"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Link>
  );
}
