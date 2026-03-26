"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, Link, FileText, AlertTriangle } from "lucide-react";

interface AddArticleDialogProps {
  onSuccess?: () => void;
}

function needsManualPaste(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes("xiaohongshu.com") || hostname.includes("xhslink.com"))
      return "小红书有反爬限制，建议复制帖文内容手动粘贴";
    if (hostname.includes("mp.weixin.qq.com") || hostname.includes("weixin.qq.com"))
      return "微信公众号有访问验证，建议复制文章内容手动粘贴";
    if (hostname.includes("douyin.com") || hostname.includes("tiktok.com"))
      return "抖音/TikTok 视频内容无法抓取，建议粘贴文字描述";
    return null;
  } catch {
    if (url.includes("xiaohongshu") || url.includes("xhslink")) return "小红书需要手动粘贴";
    if (url.includes("weixin") || url.includes("mp.weixin")) return "微信公众号需要手动粘贴";
    return null;
  }
}

export function AddArticleDialog({ onSuccess }: AddArticleDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"url" | "manual">("url");
  const [url, setUrl] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualText, setManualText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pasteWarning, setPasteWarning] = useState<string | null>(null);

  // Detect URLs that need manual paste
  useEffect(() => {
    if (mode === "url" && url.length > 5) {
      setPasteWarning(needsManualPaste(url));
    } else {
      setPasteWarning(null);
    }
  }, [url, mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // If URL mode with a problematic link, auto-switch to paste mode instead of failing
    if (mode === "url" && pasteWarning) {
      setMode("manual");
      // URL is preserved in the url state for source link
      return;
    }

    setLoading(true);
    setError("");

    try {
      const body =
        mode === "url"
          ? { url }
          : { manualText, manualTitle, url: url || undefined };

      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add article");
      }

      setUrl("");
      setManualTitle("");
      setManualText("");
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function switchToManualWithUrl() {
    setMode("manual");
    // Keep the URL so it's preserved as source URL
    setPasteWarning(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button size="sm" className="gap-1.5" />}
      >
        <Plus className="h-4 w-4" />
        Add
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Content</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === "url" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("url")}
            className="gap-1.5"
          >
            <Link className="h-3.5 w-3.5" />
            Paste URL
          </Button>
          <Button
            variant={mode === "manual" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("manual")}
            className="gap-1.5"
          >
            <FileText className="h-3.5 w-3.5" />
            Paste Text
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "url" ? (
            <>
              <Input
                placeholder="https://..."
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                disabled={loading}
                autoFocus
              />
              {pasteWarning && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-muted border border-border text-foreground">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium">{pasteWarning}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 h-7 text-xs"
                      onClick={switchToManualWithUrl}
                    >
                      切换到 Paste Text
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <Input
                placeholder="Title"
                value={manualTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualTitle(e.target.value)}
                disabled={loading}
              />
              {url && needsManualPaste(url) && (
                <div className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
                  🔗 来源链接已保留：<span className="text-foreground">{url.slice(0, 50)}...</span>
                  <br />请在下方粘贴内容，AI 会自动分析。
                </div>
              )}
              <Textarea
                placeholder="粘贴文章/帖文内容..."
                value={manualText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setManualText(e.target.value)}
                disabled={loading}
                rows={8}
                autoFocus
              />
              <Input
                placeholder="来源链接（选填）"
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                disabled={loading}
              />
            </>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading || (mode === "url" ? !url : !manualText)}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                AI 分析中...
              </>
            ) : (
              "添加并分析"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
