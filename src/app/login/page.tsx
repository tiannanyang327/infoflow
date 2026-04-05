"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("密码错误");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("网络错误，请重试");
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[oklch(0.98_0_0)]">
      <div className="w-full max-w-sm mx-auto">
        <div className="bg-background border border-border rounded-lg p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-lg bg-foreground flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-background" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">InfoFlow</h1>
              <p className="text-[11px] text-muted-foreground -mt-0.5">
                Turn information into insight
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter access password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoFocus
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Enter"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
