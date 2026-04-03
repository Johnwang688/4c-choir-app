import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  decodeSessionCookie,
  getAuthCookieName,
  getSupabaseAuthEnv,
} from "@/lib/supabase-auth";

export async function POST() {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(getAuthCookieName())?.value;
  const session = rawCookie ? decodeSessionCookie(rawCookie) : null;

  try {
    if (session?.accessToken) {
      const { url, anonKey } = getSupabaseAuthEnv();
      await fetch(`${url}/auth/v1/logout`, {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${session.accessToken}`,
        },
      }).catch(() => undefined);
    }
  } catch {
    // Clear the local cookie even if upstream logout fails.
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: getAuthCookieName(),
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
