## 工作进度存档
- **存档时间**：2026-03-25
- **任务概述**：InfoFlow — 信息碎片聚合与洞察平台，个人 portfolio 项目，1 周交付 Web demo + Chrome 扩展
- **当前状态**：核心功能已跑通，新增 Highlights 全局页（笔记流 + 圆桌讨论双视图）、Tag 粒度优化、文章删除功能

## 已完成

### 基础设施
- Next.js 16 项目初始化（TypeScript + Tailwind + shadcn/ui）
- Supabase 数据库建表（articles, tags, article_tags, conversations, messages, notes）
- Drizzle ORM schema + 查询封装
- Dev mode auth（绕过登录，固定 dev-user-001）
- 登录页（Supabase Auth，暂未启用）

### 后端 API（7 个 Route，已加 CORS）
- `POST /api/articles` — URL 粘贴 / 手动文本 → Jina Reader 抓取 → Groq AI 提取摘要/tag/关键信息 → 存库 + 自动存原文到 notes
- `GET /api/articles` — 列表查询（tag 筛选 + 搜索）
- `GET/DELETE /api/articles/[id]` — 详情/删除
- `GET /api/tags` — 用户所有 tag（带计数）
- `POST /api/chat` — AI 对话（单篇 + Tag 级，Groq Llama 3.3 70B，流式输出）
- `GET/POST /api/notes` — 用户笔记
- `GET/POST /api/articles/[id]/highlights` — 高亮存取
- `GET /api/highlights` — 全局 Highlights 聚合（支持 tag 筛选）

### 前端页面
- **Inbox 首页** — 文章卡片列表 + 侧边栏 tag 导航 + 搜索 + 空状态 + 文章删除（hover 显示删除按钮）
- **Highlights 全局页** — 双视图切换：
  - All 视图：极简笔记流（按文章分组、左侧竖线、大留白）
  - Tag 视图：圆桌讨论（多文章 highlights 对话式排列、connection line、参与者头像）
- **内容详情页** — AI Summary + Key Points + My Highlights section + Original Content（可高亮）+ AI Chat 面板
- **登录页** — Email + Password
- **添加内容** — URL 粘贴 + 手动文本 fallback + 小红书/微信/抖音智能检测提示

### Chrome 扩展（已验证可用）
- Manifest V3，content script 注入页面提取内容
- 平台适配器：微信公众号、小红书、通用网页
- Popup UI：预览 + 一键保存到 InfoFlow

### 交互功能
- **文本高亮** — 选中原文 → 弹出「高亮」+「追问」按钮
- **Send to Chat** — 选中文本点「追问」→ 内容注入到 Chat 输入框
- **快捷提问** — Chat 空状态显示 3 个动态推荐问题
- **文章删除** — hover 卡片右上角出现删除按钮，确认后删除并刷新列表

### AI 能力
- 摘要为洞察型（核心观点/可借鉴的做法）
- Tags 英文小写，**粒度已优化**：要求具体话题（ai-hardware, parenting）而非宽泛类目（ai, innovation）
- AI 对话支持单篇上下文 + Tag 级跨文章综合分析
- **Retag 脚本**：`scripts/retag.ts` 可批量重跑所有文章的 AI 标签提取

### 本次 Session 新增（2026-03-25）
1. **Tag 粒度优化** — 修改 AI prompt，要求标签反映具体话题而非宽泛类目，加正反例引导
2. **批量 Retag** — 编写并执行 `scripts/retag.ts`，重新处理 9 篇文章的标签
3. **Highlights 全局页 Design Sprint** — PM + UX Designer 双角色研讨，产出 5 个 HTML 方向原型
4. **Highlights 页面实现** — 笔记流（All）+ 圆桌讨论（Tag 筛选）双视图
5. **文章删除功能** — 卡片 hover 显示删除按钮 + 确认弹窗
6. **Sidebar 更新** — 新增 Highlights 导航入口（Highlighter 图标）

## 关键决策
- **LLM 选择**：Groq（Llama 3.3 70B）— 免费、速度快
- **微信/小红书抓取**：Chrome 扩展从浏览器端提取已渲染 DOM
- **高亮交互**：原生 DOM 操作避免选区丢失
- **Highlights 页设计**：All 视图用极简笔记流（方向 A），Tag 筛选切换到圆桌讨论视图（用户选定方向）
- **Tag 策略**：通过 prompt 引导 AI 生成具体话题标签，而非预定义标签池

## 待办/下一步
- [ ] 圆桌讨论的 Takeaway 总结（AI 生成每个 topic 的综合结论）
- [ ] 圆桌讨论的标题（AI 根据 highlights 生成话题标题）
- [ ] UI 视觉 polish（portfolio 项目要出彩）
- [ ] 响应式适配
- [ ] Vercel 部署上线
- [ ] 端到端测试（多平台 URL 验证）

## 相关文件
- 项目根目录：`side-projects/infoflow/`
- Design Sprint 文档：`side-projects/infoflow/PRD/highlights-sprint.md`
- HTML 原型（5 个方向）：`side-projects/infoflow/PRD/html_mockups/`
- Retag 脚本：`side-projects/infoflow/scripts/retag.ts`
- Highlights API：`side-projects/infoflow/src/app/api/highlights/route.ts`
- Highlights 页面：`side-projects/infoflow/src/app/highlights/page.tsx`
- AI Pipeline：`side-projects/infoflow/src/lib/ai.ts`（tag 粒度已优化）
- Chrome 扩展：`side-projects/infoflow/extension/`

## 外部服务凭证（.env.local，已 gitignore）
- Supabase: `yfhdmjlahdlxdzeiiepk` 项目
- Groq API Key: 已配置
