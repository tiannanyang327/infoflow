import { NextResponse } from "next/server";

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export function corsResponse() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export function jsonWithCors(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders() });
}
