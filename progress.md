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

### Session 3（2026-03-26 下午）— 部署
1. **Vercel 部署上线** — GitHub 公开 repo `tiannanyang327/infoflow`，Vercel 自动部署
   - 线上地址：`infoflow-two.vercel.app`
   - 环境变量已配：Supabase URL/Key、DATABASE_URL、GROQ_API_KEY
   - 首次部署只推了脚手架代码，补提交全部业务代码后触发重新部署
2. **Chrome 扩展线上化** — API_BASE 从 `localhost:3000` 改为 `https://infoflow-two.vercel.app`，manifest 加 host_permissions
3. **扩展固定路径** — 复制到 `~/infoflow-extension/`，不依赖加密盘挂载

### Session 4（2026-03-26 晚）— UI 重设计 + 产品方向讨论
1. **UI 视觉重设计（Midday AI 风格）** — 11 个文件，纯视觉改动，build 通过
   - **设计基础**：圆角 8px、边框柔化（oklch(0.93)）、focus ring 前景色、暗色模式去饱和蓝、body 微负字距
   - **Sidebar**：w-56→w-60、浅灰底 oklch(0.985)、坚定边框（去/50 透明度）、active 用 bg-foreground/[0.06]
   - **文章卡片**：去阴影（hover 用背景色变化）、源标签全部中性化 bg-muted、Badge 方角 rounded-sm
   - **详情页**：AI Summary/Highlights 区域去黄去彩、Key Points 实心黑圆白字、Section 标签 font-mono uppercase tracking-widest
   - **Chat 面板**：边框统一、建议问题按钮精致化
   - **Highlights 页**：Tag chips 黑白化（bg-foreground/text-background）、去饱和头像、竖线 2px
   - **高亮工具栏**：紫色追问按钮→深灰、黄色高亮标记→bg-foreground/10
   - **登录页**：白色卡片容器 + 浅灰背景 oklch(0.98)
   - **添加弹窗**：警告框去 amber 色，统一 bg-muted
2. **产品方向讨论** — Principal PM × 行为设计专家 6 轮深度讨论："如何让信息真正流动起来"
   - 诊断出三个断裂点：收藏→阅读（情境记忆丢失）、阅读→思考（模式切换成本）、思考→连接（触发缺失）
   - 5 个功能建议（P0→P4）：上下文召回 → Quick Thought → AI 双模式自适应 → 圆桌增强 → 思维演化视图
   - 核心原则：系统做 90% 连接，用户做 10% 判断；AI 是苏格拉底式对话者，不替用户思考
   - 讨论全文：`/private/tmp/claude-501/-Volumes-Personal-personal-vault/95cd3a97-b766-469e-8241-3cb5f8a7bd8b/tasks/adb3905e8b63d2489.output`

## 待办/下一步
- [ ] 验证 Vercel 部署是否正常运行（页面渲染 + API 调用）
- [ ] Chrome 扩展加载并验证线上保存功能
- [ ] 圆桌讨论的 Takeaway 总结（AI 生成每个 topic 的综合结论）
- [ ] 圆桌讨论的标题（AI 根据 highlights 生成话题标题）
- [x] ~~UI 视觉 polish（portfolio 项目要出彩）~~ — 已完成 Midday AI 风格重设计
- [ ] 响应式适配
- [ ] 端到端测试（多平台 URL 验证）
- [ ] 产品方向功能落地：上下文召回（P0）、Quick Thought（P1）等
- [ ] 将产品讨论产出整理成 PRD

## 关键决策
- **LLM 选择**：Groq（Llama 3.3 70B）— 免费、速度快
- **微信/小红书抓取**：Chrome 扩展从浏览器端提取已渲染 DOM
- **高亮交互**：原生 DOM 操作避免选区丢失
- **Highlights 页设计**：All 视图用极简笔记流（方向 A），Tag 筛选切换到圆桌讨论视图（用户选定方向）
- **Tag 策略**：通过 prompt 引导 AI 生成具体话题标签，而非预定义标签池
- **部署方案**：Vercel + GitHub 关联，push 自动部署；Chrome 扩展复制到固定路径避免加密盘依赖
- **UI 设计语言**：参考 Midday AI — 克制即高级，中性色板、零阴影、零饱和色、坚定边框、8px 圆角
- **产品方向**：AI 角色定位为苏格拉底式对话者，不替用户思考；信息流动靠系统自动连接 + 用户轻量判断

## 相关文件
- 项目根目录：`side-projects/infoflow/`
- Design Sprint 文档：`side-projects/infoflow/PRD/highlights-sprint.md`
- HTML 原型（5 个方向）：`side-projects/infoflow/PRD/html_mockups/`
- Retag 脚本：`side-projects/infoflow/scripts/retag.ts`
- Highlights API：`side-projects/infoflow/src/app/api/highlights/route.ts`
- Highlights 页面：`side-projects/infoflow/src/app/highlights/page.tsx`
- AI Pipeline：`side-projects/infoflow/src/lib/ai.ts`（tag 粒度已优化）
- Chrome 扩展源码：`side-projects/infoflow/extension/`
- Chrome 扩展固定副本：`~/infoflow-extension/`
- GitHub repo：`https://github.com/tiannanyang327/infoflow`
- 线上地址：`https://infoflow-two.vercel.app`

## 外部服务凭证（.env.local，已 gitignore）
- Supabase: `yfhdmjlahdlxdzeiiepk` 项目
- Groq API Key: 已配置
- Vercel 环境变量：已同步配置上述 4 个变量
