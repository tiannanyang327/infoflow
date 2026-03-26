export const sourceConfig: Record<string, { label: string; color: string; emoji: string }> = {
  twitter: { label: "X/Twitter", color: "bg-muted text-muted-foreground", emoji: "𝕏" },
  wechat: { label: "WeChat", color: "bg-muted text-muted-foreground", emoji: "💬" },
  xiaohongshu: { label: "Xiaohongshu", color: "bg-muted text-muted-foreground", emoji: "📕" },
  newsletter: { label: "Newsletter", color: "bg-muted text-muted-foreground", emoji: "📧" },
  web: { label: "Web", color: "bg-muted text-muted-foreground", emoji: "🌐" },
};

export function getSourceInfo(sourceType: string) {
  return sourceConfig[sourceType] || sourceConfig.web;
}
