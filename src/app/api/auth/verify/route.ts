import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const apiKey = process.env.INFOFLOW_API_KEY;

  if (!apiKey || password !== apiKey) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const tokenHash = createHash("sha256").update(apiKey).digest("hex");

  const response = NextResponse.json({ ok: true });
  response.cookies.set("infoflow-token", tokenHash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return response;
}
