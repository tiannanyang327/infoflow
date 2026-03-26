"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Sparkles, User } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  contextType: "article" | "tag";
  contextId: string;
  placeholder?: string;
  injectedMessage?: string;
  onInjectedMessageHandled?: () => void;
  suggestedQuestions?: string[];
}

export function ChatPanel({ contextType, contextId, placeholder, injectedMessage, onInjectedMessageHandled, suggestedQuestions = [] }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle injected message from text selection
  useEffect(() => {
    if (injectedMessage) {
      setInput(`关于这段内容：「${injectedMessage}」\n\n`);
      onInjectedMessageHandled?.();
      // Focus, put cursor at end, auto-resize
      setTimeout(() => {
        const el = inputRef.current;
        if (el) {
          el.focus();
          el.setSelectionRange(el.value.length, el.value.length);
          el.style.height = "auto";
          el.style.height = Math.min(el.scrollHeight, 160) + "px";
        }
      }, 100);
    }
  }, [injectedMessage, onInjectedMessageHandled]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          contextType,
          contextId,
        }),
      });

      if (!res.ok) throw new Error("Chat failed");

      // Read streaming response
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantMessage = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantMessage += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: assistantMessage,
          };
          return updated;
        });
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">AI Chat</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col justify-end h-full">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-2">试试问问：</p>
              {suggestedQuestions.length > 0 ? (
                suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(q);
                      setTimeout(() => {
                        const el = inputRef.current;
                        if (el) {
                          el.focus();
                          el.style.height = "auto";
                          el.style.height = Math.min(el.scrollHeight, 160) + "px";
                        }
                      }, 50);
                    }}
                    className="block w-full text-left text-sm px-3 py-2 rounded-lg border border-border/60 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    {q}
                  </button>
                ))
              ) : (
                <>
                  <button
                    onClick={() => setInput("这篇内容的核心观点是什么？")}
                    className="block w-full text-left text-sm px-3 py-2 rounded-lg border border-border/60 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    这篇内容的核心观点是什么？
                  </button>
                  <button
                    onClick={() => setInput("有哪些可以借鉴的做法？")}
                    className="block w-full text-left text-sm px-3 py-2 rounded-lg border border-border/60 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    有哪些可以借鉴的做法？
                  </button>
                  <button
                    onClick={() => setInput("用一句话总结这篇内容")}
                    className="block w-full text-left text-sm px-3 py-2 rounded-lg border border-border/60 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    用一句话总结这篇内容
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className="flex gap-2.5">
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    msg.role === "user"
                      ? "bg-muted"
                      : "bg-primary/10"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
                <div className="flex-1 text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content || (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border/50">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-resize
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this content..."
            rows={1}
            className="min-h-[36px] max-h-[160px] resize-none text-sm overflow-y-auto"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="h-9 w-9 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
