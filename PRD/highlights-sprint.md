# Highlights 全局页 Design Sprint
> 2026-03-25 | 状态：进行中

## 1. 需求简报

**目标用户**：InfoFlow 个人用户（产品经理，日常收集行业文章、公众号、推文等信息源）

**场景**：用户已经通过 InfoFlow 收藏了多篇文章，每篇文章经 AI 提取出 keyPoints（可借鉴的具体做法或观点）。这些 keyPoints 散落在各篇文章详情中，用户需要一个全局视图来回顾"我到底沉淀了哪些有价值的东西"，跨文章发现关联和规律。

**业务目标**：让 keyPoints 从"文章附属品"升级为"独立的知识资产"，提升用户对 InfoFlow 的沉淀感和回访动力。

**约束条件**：
- 现有技术栈：Next.js 16 + Tailwind + Supabase + Drizzle ORM
- 数据来源：articles.keyPoints (jsonb string[])，通过 article_tags 关联 tag
- UI 框架：已有 Sidebar（Inbox + Tags） + 文章列表 + 文章详情的三层结构
- 当前文章量级较小（~10 篇），但设计需考虑 50-100 篇时的可用性

## 2. 角色研讨

### PM 视角

**核心观点**：
1. **Highlights 的本质是"脱离来源的知识碎片重组"** — 打破文章容器的边界，让洞察按主题（tag）而非来源聚合，是从"收藏工具"到"知识工具"的关键跃迁
2. **信息组织应以 Tag 为一级维度，时间为二级维度** — 用户回顾时的心智模型是"关于某个话题，我积累了哪些认知"，不是"上周收藏了什么"
3. **keyPoint 必须保留来源锚点** — 每条脱离文章展示的 keyPoint 需附带来源信息（文章标题 + icon），点击可跳回原文
4. **这是笔记系统的入口** — 天然适合承载用户对 keyPoint 的二次加工，形成"AI 提取 → 用户沉淀"的闭环
5. **Sidebar 中与 Inbox 平级** — Inbox（收藏流）和 Highlights（知识沉淀）是两个平行的核心场景

**风险提醒**：
- keyPoints 质量参差 + 数量膨胀（300-500 条）可能让页面变成信息垃圾场，需考虑筛选和排序机制
- 跨文章的 keyPoints 语义去重是隐藏复杂度（多篇文章可能提出相似观点）

**设计建议**：
- 采用"Tag 分组 + 展开/折叠"信息层级，点击 Sidebar tag 时自动展开对应分组
- 优先做"被动回顾"（如 Daily Review 随机展示 3-5 条）而非"主动搜索"

---

### UX Designer 视角

**核心观点**：
1. **highlight 文本是绝对主角，元数据退后** — 视觉权重：keyPoint 文本 > 来源文章标题 > tags。用左侧 3px 竖线做分隔，不要给每条加卡片边框
2. **Tag 筛选是第一优先级交互** — 顶部 tag chips 水平排列，点击即筛选。30-100 条量级不需要搜索框
3. **MVP 只做一种视图** — 按时间倒序、文章分组。主题聚合通过 tag 筛选实现，不需要单独视图切换
4. **Sidebar 入口用荧光笔图标** — 放在 Inbox 下方、Tags 上方
5. **默认折叠策略** — 只展开最近 7 天的文章分组，更早的折叠显示标题

**风险提醒**：
- 100 篇 × 3 条 = 300 条全量渲染会卡，需分页或虚拟滚动
- keyPoint 脱离原文后可能含义模糊，建议支持 hover 展开上下文

**设计建议**：
- 参考 Readwise Reader 的 Notebook 视图：左侧复用 sidebar tags 筛选，右侧按文章分组
- 页面顶部加 "Random Resurface" 卡片（随机 1-3 条历史 highlight），解决"收藏了不看"的痛点

---

### 共识点
- Highlights 在 Sidebar 中与 Inbox 平级
- keyPoint 必须保留来源文章锚点
- Tag 筛选是核心交互
- 建议加入 Daily Review / Random Resurface 机制

### 分歧点
| 议题 | PM | UX Designer |
|------|-----|-------------|
| 默认分组维度 | 按 Tag 分组 | 按文章分组（时间倒序） |
| 视图切换 | 支持 Tag 视图 + 时间线视图 | MVP 只做一种 |

**裁决**：MVP 采用 UX Designer 方案 — 按时间倒序、文章分组，Tag 筛选覆盖主题聚合需求。理由：实现成本低，且用户当前数据量（~10 篇）下 tag 分组的信息密度不够。

## 3. 设计简报

### 方案概述
为 InfoFlow 新增全局 Highlights 页面，将散落在各文章中的 keyPoints 汇聚为一个按时间倒序、文章分组的知识回顾视图。顶部 tag chips 筛选 + 可选的 Random Resurface 模块，让用户在浏览中被动重温重要洞察。Sidebar 新增 Highlights 一级导航入口。

### 方向 A: 极简笔记流
以 highlight 文本为绝对主角，左侧竖线分隔，文章标题作为轻量分组头。无卡片、无边框，大量留白。顶部 tag chips 筛选。视觉参考：Bear 笔记、iA Writer。
**适合**：强调阅读体验和内容本身。

### 方向 B: 结构化知识卡片
每篇文章作为一张卡片，内含 keyPoints 列表。卡片头部显示来源 emoji + 标题 + 时间。顶部 tag chips 筛选 + Random Resurface 卡片区。视觉参考：Readwise Notebook。
**适合**：强调来源上下文和信息结构。

### 方向 C: 杂志式编排
打破严格的列表结构，用大小不一的卡片 + 醒目的 tag 标题做视觉节奏。重点 highlight 用大字体突出，次要的用小字体密排。视觉参考：Pinterest + Notion Gallery。
**适合**：强调视觉吸引力和发现感。
