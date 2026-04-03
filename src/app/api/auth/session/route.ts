import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  decodeSessionCookie,
  encodeSessionCookie,
  getAuthCookieName,
  getSupabaseAuthEnv,
} from "@/lib/supabase-auth";

function buildClearedSessionResponse() {
  const response = NextResponse.json({ authenticated: false });
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

export async function GET() {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(getAuthCookieName())?.value;

  if (!rawCookie) {
    return NextResponse.json({ authenticated: false });
  }

  const session = decodeSessionCookie(rawCookie);
  if (!session?.accessToken) {
    return buildClearedSessionResponse();
  }

  try {
    const { url, anonKey } = getSupabaseAuthEnv();

    const response = await fetch(`${url}/auth/v1/user`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return buildClearedSessionResponse();
    }

    const data = (await response.json()) as { email?: string | null };
    const result = NextResponse.json({
      authenticated: true,
      user: { email: data.email ?? session.email },
    });

    if (session.expiresAt && session.expiresAt > Date.now()) {
      result.cookies.set({
        name: getAuthCookieName(),
        value: encodeSessionCookie({
          ...session,
          email: data.email ?? session.email,
        }),
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: Math.max(
          1,
          Math.floor((session.expiresAt - Date.now()) / 1000),
        ),
      });
    }

    return result;
  } catch {
    return buildClearedSessionResponse();
  }
}
