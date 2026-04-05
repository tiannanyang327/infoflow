import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and auth API
  if (pathname === "/login" || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Check Authorization header (Chrome extension path)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (token === process.env.INFOFLOW_API_KEY) {
      return NextResponse.next();
    }
  }

  // Check cookie (web path)
  const cookie = request.cookies.get("infoflow-token")?.value;
  if (cookie && process.env.INFOFLOW_API_KEY) {
    const expectedHash = await sha256(process.env.INFOFLOW_API_KEY);
    if (cookie === expectedHash) {
      return NextResponse.next();
    }
  }

  // Unauthenticated
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
