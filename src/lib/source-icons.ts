export const sourceConfig: Record<string, { label: string; color: string; emoji: string }> = {
  twitter: { label: "X/Twitter", color: "bg-black text-white", emoji: "𝕏" },
  wechat: { label: "WeChat", color: "bg-green-500 text-white", emoji: "💬" },
  xiaohongshu: { label: "Xiaohongshu", color: "bg-red-500 text-white", emoji: "📕" },
  newsletter: { label: "Newsletter", color: "bg-purple-500 text-white", emoji: "📧" },
  web: { label: "Web", color: "bg-blue-500 text-white", emoji: "🌐" },
};

export function getSourceInfo(sourceType: string) {
  return sourceConfig[sourceType] || sourceConfig.web;
}
