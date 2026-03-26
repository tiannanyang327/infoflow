"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Hash, Inbox, Sparkles, Highlighter } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface TagWithCount {
  tag: { id: string; name: string; color: string | null };
  count: number;
}

export function Sidebar() {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get("tag");

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then(setTags)
      .catch(console.error);
  }, [pathname]);

  return (
    <aside className="w-60 flex-shrink-0 border-r border-border bg-[oklch(0.985_0_0)] flex flex-col">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-md bg-foreground flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-background" />
          </div>
          <span className="font-semibold text-[13px] tracking-tight">InfoFlow</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="px-2 py-2">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors",
            !activeTag && pathname === "/"
              ? "bg-foreground/[0.06] text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
          )}
        >
          <Inbox className="h-4 w-4" />
          All Articles
        </Link>
        <Link
          href="/highlights"
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors",
            pathname === "/highlights"
              ? "bg-foreground/[0.06] text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
          )}
        >
          <Highlighter className="h-4 w-4" />
          Highlights
        </Link>
      </nav>

      {/* Tags */}
      <div className="px-5 py-2">
        <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-widest">
          Topics
        </p>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5 pb-4">
          {tags.map(({ tag, count }) => (
            <Link
              key={tag.id}
              href={tag.name === activeTag ? "/" : `/?tag=${encodeURIComponent(tag.name)}`}
              className={cn(
                "flex items-center gap-2 px-3 py-[7px] rounded-md text-[13px] transition-colors",
                activeTag === tag.name
                  ? "bg-foreground/[0.06] text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
              )}
            >
              <Hash className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate flex-1">{tag.name}</span>
              <span className="text-[10px] text-muted-foreground">{count}</span>
            </Link>
          ))}

          {tags.length === 0 && (
            <p className="px-3 py-4 text-xs text-muted-foreground text-center">
              No topics yet. Add your first article!
            </p>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
