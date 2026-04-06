import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  decodeSessionCookie,
  getAuthCookieName,
  getSupabaseAuthEnv,
} from "@/lib/supabase-auth";

type Body = {
  currentPassword?: unknown;
  newPassword?: unknown;
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

  const currentPassword = asField(body.currentPassword, 200);
  const newPassword = asField(body.newPassword, 200);

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current password and new password are required." },
      { status: 400 },
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "New password must be at least 6 characters long." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(getAuthCookieName())?.value;
  const session = rawCookie ? decodeSessionCookie(rawCookie) : null;

  if (!session?.accessToken || !session.email) {
    return NextResponse.json(
      { error: "You need to be signed in to change your password." },
      { status: 401 },
    );
  }

  try {
    const { url, anonKey } = getSupabaseAuthEnv();

    const verifyResponse = await fetch(
      `${url}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
        },
        body: JSON.stringify({
          email: session.email,
          password: currentPassword,
        }),
      },
    );

    const verifyData = (await verifyResponse.json().catch(() => ({}))) as {
      error_description?: string;
      msg?: string;
    };

    if (!verifyResponse.ok) {
      return NextResponse.json(
        {
          error:
            verifyData.error_description ??
            verifyData.msg ??
            "Your current password is incorrect.",
        },
        { status: verifyResponse.status || 401 },
      );
    }

    const updateResponse = await fetch(`${url}/auth/v1/user`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ password: newPassword }),
    });

    const updateData = (await updateResponse.json().catch(() => ({}))) as {
      msg?: string;
      error_description?: string;
    };

    if (!updateResponse.ok) {
      return NextResponse.json(
        {
          error:
            updateData.error_description ??
            updateData.msg ??
            "Unable to update your password right now.",
        },
        { status: updateResponse.status || 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Your password has been updated.",
    });
  } catch {
    return NextResponse.json(
      { error: "Auth is not configured correctly on the server." },
      { status: 500 },
    );
  }
}
