import { NextResponse } from "next/server";
import {
  buildSessionCookie,
  encodeSessionCookie,
  getAuthCookieName,
  getSupabaseAuthEnv,
} from "@/lib/supabase-auth";

type Body = {
  email?: unknown;
  password?: unknown;
};

function asField(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const email = asField(body.email, 254).toLowerCase();
  const password = asField(body.password, 200);

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  try {
    const { url, anonKey } = getSupabaseAuthEnv();

    const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      user?: { email?: string | null };
      error_description?: string;
      msg?: string;
    };

    if (!response.ok || !data.access_token) {
      return NextResponse.json(
        {
          error:
            data.error_description ??
            data.msg ??
            "We couldn't sign you in with that email and password.",
        },
        { status: response.status || 401 },
      );
    }

    const session = buildSessionCookie({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      email: data.user?.email ?? email,
    });

    const result = NextResponse.json({
      ok: true,
      user: { email: session.email },
    });

    result.cookies.set({
      name: getAuthCookieName(),
      value: encodeSessionCookie(session),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: data.expires_in ?? 60 * 60,
    });

    return result;
  } catch {
    return NextResponse.json(
      { error: "Auth is not configured correctly on the server." },
      { status: 500 },
    );
  }
}
