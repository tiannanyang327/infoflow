"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";

interface HighlightableContentProps {
  content: string;
  articleId: string;
  highlights: string[];
  onHighlightsChange: (highlights: string[]) => void;
  onSendToChat?: (text: string) => void;
}

export function HighlightableContent({
  content,
  articleId,
  highlights,
  onHighlightsChange,
  onSendToChat,
}: HighlightableContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const pendingTextRef = useRef<string>("");
  const pendingIndexRef = useRef<number>(-1);

  // Create toolbar DOM element once (outside React render cycle)
  useEffect(() => {
    const toolbar = document.createElement("div");
    toolbar.className = "fixed z-50 hidden";
    toolbar.style.transform = "translateX(-50%)";
    document.body.appendChild(toolbar);
    toolbarRef.current = toolbar;

    return () => {
      toolbar.remove();
      toolbarRef.current = null;
    };
  }, []);

  // Stable refs to latest highlights for use in DOM event handlers
  const highlightsRef = useRef(highlights);
  highlightsRef.current = highlights;

  const saveHighlights = useCallback(async (newHighlights: string[]) => {
    await fetch(`/api/articles/${articleId}/highlights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ highlights: newHighlights }),
    });
  }, [articleId]);

  const doAddHighlight = useCallback(() => {
    const text = pendingTextRef.current;
    if (!text || highlightsRef.current.includes(text)) return;

    const newHighlights = [...highlightsRef.current, text];
    onHighlightsChange(newHighlights);
    window.getSelection()?.removeAllRanges();
    toolbarRef.current?.classList.add("hidden");
    saveHighlights(newHighlights);
  }, [saveHighlights, onHighlightsChange]);

  const doSendToChat = useCallback(() => {
    const text = pendingTextRef.current;
    if (!text || !onSendToChat) return;

    onSendToChat(text);
    window.getSelection()?.removeAllRanges();
    toolbarRef.current?.classList.add("hidden");
  }, [onSendToChat]);

  const doRemoveHighlight = useCallback(() => {
    const idx = pendingIndexRef.current;
    if (idx < 0) return;

    const newHighlights = highlightsRef.current.filter((_, i) => i !== idx);
    onHighlightsChange(newHighlights);
    toolbarRef.current?.classList.add("hidden");
    saveHighlights(newHighlights);
  }, [saveHighlights]);

  function showToolbar(x: number, y: number, mode: "add" | "remove") {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;

    toolbar.style.left = `${x}px`;
    toolbar.style.top = `${y}px`;
    toolbar.classList.remove("hidden");

    if (mode === "add") {
      toolbar.innerHTML = `
        <div style="display:flex;gap:4px;">
          <button data-action="highlight" class="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-full shadow-lg transition-opacity"
                  style="background:oklch(0.145 0 0);color:white;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>
            高亮
          </button>
          <button data-action="chat" class="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-full shadow-lg transition-opacity"
                  style="background:oklch(0.45 0 0);color:white;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            追问
          </button>
        </div>`;
      toolbar.querySelectorAll("button").forEach((btn) => {
        btn.onmousedown = (e) => e.preventDefault();
      });
      (toolbar.querySelector('[data-action="highlight"]') as HTMLButtonElement).onclick = doAddHighlight;
      (toolbar.querySelector('[data-action="chat"]') as HTMLButtonElement).onclick = doSendToChat;
    } else {
      toolbar.innerHTML = `
        <button class="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-full shadow-lg transition-opacity"
                style="background:oklch(0.55 0.12 20);color:white;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          取消高亮
        </button>`;
      const btn = toolbar.querySelector("button")!;
      btn.onmousedown = (e) => e.preventDefault();
      btn.onclick = doRemoveHighlight;
    }
  }

  // mouseup: detect text selection → show add toolbar
  const handleMouseUp = useCallback(() => {
    requestAnimationFrame(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 2 && contentRef.current?.contains(selection?.anchorNode || null)) {
        // Don't highlight inside existing marks
        const anchorEl = selection?.anchorNode?.parentElement;
        if (anchorEl?.tagName === "MARK") return;

        const range = selection!.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        pendingTextRef.current = text;
        showToolbar(rect.left + rect.width / 2, rect.top - 44, "add");
      }
    });
  }, []);

  // click: on <mark> show remove toolbar, elsewhere hide toolbar
  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    if (target.tagName === "MARK") {
      const markText = target.textContent || "";
      const index = highlightsRef.current.indexOf(markText);
      if (index === -1) return;

      const rect = target.getBoundingClientRect();
      pendingIndexRef.current = index;
      showToolbar(rect.left + rect.width / 2, rect.top - 44, "remove");
      return;
    }

    // Click on non-mark area with no selection → hide
    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) {
      toolbarRef.current?.classList.add("hidden");
    }
  }, []);

  // Memoize rendered HTML — only changes when highlights change
  const renderedHtml = useMemo(() => {
    if (highlights.length === 0) return content;

    let result = content;
    const sorted = [...highlights].sort((a, b) => b.length - a.length);
    const placeholders: { placeholder: string; html: string }[] = [];

    for (const hl of sorted) {
      const escaped = hl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const placeholder = `__HL${placeholders.length}__`;
      const html = `<mark class="bg-foreground/10 rounded-sm px-0.5 cursor-pointer hover:bg-foreground/15 transition-colors">${hl}</mark>`;
      placeholders.push({ placeholder, html });
      result = result.replace(new RegExp(escaped, "g"), placeholder);
    }

    for (const { placeholder, html } of placeholders) {
      result = result.replaceAll(placeholder, html);
    }

    return result;
  }, [content, highlights]);

  return (
    <div
      ref={contentRef}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap select-text cursor-text"
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}
