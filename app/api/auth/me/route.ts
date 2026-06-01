import { NextResponse } from "next/server";
import { getFreshSessionUser } from "@/lib/auth";

/**
 * GET /api/auth/me
 * Retrieve current authenticated user's session data
 */
export async function GET() {
  const user = await getFreshSessionUser();
  return NextResponse.json({ user });
}
