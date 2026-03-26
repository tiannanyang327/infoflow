import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getUserTags } from "@/lib/db/queries";

export async function GET() {
  const user = await getUser();
  const result = await getUserTags(user.id);
  return NextResponse.json(result);
}
