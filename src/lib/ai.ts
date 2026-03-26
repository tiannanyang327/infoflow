import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY! });

export interface AIExtraction {
  summary: string;
  keyPoints: string[];
  tags: string[];
  language: "zh" | "en" | "mixed";
}

export async function extractArticleInfo(
  content: string,
  title: string,
  existingTags: string[]
): Promise<AIExtraction> {
  const truncatedContent = content.length > 6000
    ? content.slice(0, 6000) + "\n\n[Content truncated...]"
    : content;

  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    prompt: `你是一个帮用户从信息中提炼洞察的助手。分析以下内容，提取对读者有价值的洞察。

标题: ${title}

正文:
${truncatedContent}

用户已有的标签（优先匹配）: [${existingTags.join(", ")}]

用纯 JSON 回复（不要 markdown，不要代码块）：
{
  "summary": "核心洞察（不是概括内容讲了什么，而是这篇内容最值得记住的观点/发现/方法论是什么，对读者有什么启发，2-3 句话）",
  "keyPoints": ["可借鉴的具体做法或观点1", "可借鉴的具体做法或观点2", "可借鉴的具体做法或观点3"],
  "tags": ["tag1", "tag2", "tag3"],
  "language": "zh" or "en" or "mixed"
}

要求：
- summary 和 keyPoints 必须用中文，不管原文是什么语言
- summary 不要写"本文讲述了..."、"这篇文章介绍了..."这类描述型开头，直接给出核心洞察
- keyPoints 要具体、可操作，不要泛泛而谈。比如"用 X 方法解决了 Y 问题"比"介绍了一种方法"有价值得多
- tags 用小写英文，2-4 个，优先匹配用户已有标签
- tags 必须是具体话题，不能是宽泛类目。好的例子：ai-hardware、fundraising、parenting、subscription-pricing、computer-vision。坏的例子：ai、innovation、product development、technology、business
- 每个 tag 应该具体到"如果用户按这个 tag 过滤，出来的文章确实是同一个话题"的粒度
- language 检测原文语言`,
  });

  try {
    const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(jsonStr);
    return {
      summary: parsed.summary || "",
      keyPoints: parsed.keyPoints || parsed.key_points || [],
      tags: (parsed.tags || []).map((t: string) => t.toLowerCase().trim()),
      language: parsed.language || "en",
    };
  } catch {
    return {
      summary: text.slice(0, 200),
      keyPoints: [],
      tags: ["unprocessed"],
      language: "en",
    };
  }
}
