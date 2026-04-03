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

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters long." },
      { status: 400 },
    );
  }

  try {
    const { url, anonKey } = getSupabaseAuthEnv();

    const response = await fetch(`${url}/auth/v1/signup`, {
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

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data.error_description ??
            data.msg ??
            "We couldn't create that account right now.",
        },
        { status: response.status || 400 },
      );
    }

    const result = NextResponse.json({
      ok: true,
      needsEmailConfirmation: !data.access_token,
      message: data.access_token
        ? "Account created and signed in."
        : "Account created. Check your email to confirm your address before signing in.",
      user: { email: data.user?.email ?? email },
    });

    if (data.access_token) {
      const session = buildSessionCookie({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        email: data.user?.email ?? email,
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
    }

    return result;
  } catch {
    return NextResponse.json(
      { error: "Auth is not configured correctly on the server." },
      { status: 500 },
    );
  }
}
