export interface ExtractedContent {
  title: string;
  author: string;
  content: string;
  publishedAt?: string;
  sourceType: "twitter" | "newsletter" | "xiaohongshu" | "wechat" | "web";
  url: string;
}

function detectSourceType(url: string): ExtractedContent["sourceType"] {
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname.includes("twitter.com") || hostname.includes("x.com")) return "twitter";
  if (hostname.includes("mp.weixin.qq.com")) return "wechat";
  if (hostname.includes("xiaohongshu.com") || hostname.includes("xhslink.com")) return "xiaohongshu";
  if (hostname.includes("substack.com") || hostname.includes("beehiiv.com") || hostname.includes("mailchi.mp")) return "newsletter";
  return "web";
}

// Check if scraped content looks like a block/error page
function isContentValid(content: string, sourceType: string): boolean {
  if (!content || content.length < 50) return false;

  const errorPatterns = [
    "环境异常", "验证", "请完成验证", "访问过于频繁",
    "请在微信客户端打开", "page not found", "access denied",
    "403 forbidden", "captcha", "robot",
  ];

  const lowerContent = content.toLowerCase();
  for (const pattern of errorPatterns) {
    if (lowerContent.includes(pattern.toLowerCase())) return false;
  }

  return true;
}

// Strategy 1: Jina Reader (default, fast, free)
async function fetchWithJina(url: string): Promise<ExtractedContent | null> {
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const response = await fetch(jinaUrl, {
      headers: {
        Accept: "application/json",
        "X-Return-Format": "markdown",
        // Use mobile UA for better success with Chinese platforms
        "X-With-Generated-Alt": "true",
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.data?.content || data.data?.text || "";
    const sourceType = detectSourceType(url);

    if (!isContentValid(content, sourceType)) return null;

    return {
      title: data.data?.title || "Untitled",
      author: data.data?.author || "",
      content,
      publishedAt: data.data?.publishedTime || undefined,
      sourceType,
      url,
    };
  } catch {
    return null;
  }
}

// Strategy 2: Direct fetch with mobile User-Agent (for WeChat, Xiaohongshu)
async function fetchDirect(url: string): Promise<ExtractedContent | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
      redirect: "follow",
    });

    if (!response.ok) return null;

    const html = await response.text();
    const sourceType = detectSourceType(url);

    // Extract content from HTML
    const extracted = extractFromHtml(html, sourceType);
    if (!extracted || !isContentValid(extracted.content, sourceType)) return null;

    return {
      ...extracted,
      sourceType,
      url,
    };
  } catch {
    return null;
  }
}

// Simple HTML content extractor
function extractFromHtml(
  html: string,
  sourceType: string
): { title: string; author: string; content: string } | null {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/);

  const title = titleMatch ? titleMatch[1].replace(/&[^;]+;/g, " ").trim() : "Untitled";

  if (sourceType === "wechat") {
    // WeChat article: content is in <div id="js_content">
    const contentMatch = html.match(
      /<div[^>]*class="rich_media_content"[^>]*id="js_content"[^>]*>([\s\S]*?)<\/div>\s*<script/
    ) || html.match(
      /<div[^>]*id="js_content"[^>]*>([\s\S]*?)<\/div>/
    );

    if (contentMatch) {
      const content = stripHtml(contentMatch[1]);
      if (content.length > 50) {
        // Extract author from meta
        const authorMatch = html.match(/var\s+nickname\s*=\s*["']([^"']+)["']/);
        return { title, author: authorMatch?.[1] || "", content };
      }
    }
  }

  if (sourceType === "xiaohongshu") {
    // Xiaohongshu: note content is in initial state JSON or specific divs
    const jsonMatch = html.match(/__INITIAL_STATE__\s*=\s*({[\s\S]*?})\s*<\/script/);
    if (jsonMatch) {
      try {
        // Clean the JSON (XHS uses undefined in JSON which is invalid)
        const cleanJson = jsonMatch[1].replace(/undefined/g, "null");
        const state = JSON.parse(cleanJson);
        const noteData = state?.note?.noteDetailMap;
        if (noteData) {
          const firstNote = Object.values(noteData)[0] as Record<string, unknown>;
          const note = firstNote?.note as Record<string, unknown> | undefined;
          if (note) {
            const desc = (note.desc as string) || "";
            const noteTitle = (note.title as string) || "";
            const user = note.user as Record<string, string> | undefined;
            return {
              title: noteTitle || title,
              author: user?.nickname || "",
              content: noteTitle ? `${noteTitle}\n\n${desc}` : desc,
            };
          }
        }
      } catch {
        // JSON parse failed, try regex fallback
      }
    }

    // Fallback: try to find note description in meta tags
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
    if (descMatch && descMatch[1].length > 30) {
      return { title, author: "", content: descMatch[1] };
    }
  }

  // Generic: try <article>, <main>, or <body>
  const articleMatch =
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);

  if (articleMatch) {
    const content = stripHtml(articleMatch[1]);
    if (content.length > 100) {
      return { title, author: "", content };
    }
  }

  return null;
}

// Strip HTML tags, decode entities, clean whitespace
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[^;]+;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

// Strategy 3: Jina with s.jina.ai (search-based, as last resort)
async function fetchWithJinaSearch(url: string, title?: string): Promise<ExtractedContent | null> {
  try {
    // Use Jina search to find cached/indexed version of the content
    const query = title || url;
    const response = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const results = data.data || [];
    const sourceType = detectSourceType(url);

    // Find a result that matches the URL or has substantial content
    for (const result of results) {
      if (result.content && result.content.length > 200) {
        return {
          title: result.title || "Untitled",
          author: "",
          content: result.content,
          sourceType,
          url,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Main fetch function: try multiple strategies
export async function fetchContent(url: string): Promise<ExtractedContent> {
  const sourceType = detectSourceType(url);

  // Strategy order depends on source type
  if (sourceType === "wechat" || sourceType === "xiaohongshu") {
    // For Chinese platforms: try direct fetch first (custom parsing), then Jina
    const direct = await fetchDirect(url);
    if (direct) return direct;

    const jina = await fetchWithJina(url);
    if (jina) return jina;

    // Last resort: search for cached version
    const search = await fetchWithJinaSearch(url);
    if (search) return search;

    throw new Error(
      sourceType === "wechat"
        ? "微信文章抓取失败，请复制文章内容使用「Paste Text」模式"
        : "小红书内容抓取失败，请复制帖文内容使用「Paste Text」模式"
    );
  }

  // For other sources: Jina first, then direct
  const jina = await fetchWithJina(url);
  if (jina) return jina;

  const direct = await fetchDirect(url);
  if (direct) return direct;

  throw new Error("内容抓取失败，请尝试使用「Paste Text」模式手动粘贴");
}

export function createManualContent(
  text: string,
  title: string,
  url?: string
): ExtractedContent {
  return {
    title,
    author: "",
    content: text,
    sourceType: url ? detectSourceType(url) : "web",
    url: url || `manual://${Date.now()}`,
  };
}
