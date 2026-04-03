const AUTH_COOKIE = "fourc-auth";

type SupabaseAuthEnv = {
  url: string;
  anonKey: string;
};

type SessionCookie = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;
  email: string | null;
};

function toApiUrl(raw: string) {
  const value = raw.trim();

  if (value.includes(".supabase.co")) {
    return value.replace(/\/$/, "");
  }

  const projectMatch = value.match(/\/project\/([a-z0-9]+)/i);
  if (!projectMatch) {
    throw new Error("SUPABASE_PROJECT_URL is not a recognized Supabase URL.");
  }

  return `https://${projectMatch[1]}.supabase.co`;
}

export function getSupabaseAuthEnv(): SupabaseAuthEnv {
  const rawUrl = process.env.SUPABASE_PROJECT_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!rawUrl || !anonKey) {
    throw new Error(
      "Missing SUPABASE_PROJECT_URL or SUPABASE_ANON_KEY environment variables.",
    );
  }

  return {
    url: toApiUrl(rawUrl),
    anonKey,
  };
}

export function getAuthCookieName() {
  return AUTH_COOKIE;
}

export function encodeSessionCookie(value: SessionCookie) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

export function decodeSessionCookie(value: string): SessionCookie | null {
  try {
    return JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as SessionCookie;
  } catch {
    return null;
  }
}

export function buildSessionCookie(input: {
  accessToken: string;
  refreshToken?: string | null;
  expiresIn?: number | null;
  email?: string | null;
}): SessionCookie {
  const expiresAt =
    typeof input.expiresIn === "number"
      ? Date.now() + input.expiresIn * 1000
      : null;

  return {
    accessToken: input.accessToken,
    refreshToken: input.refreshToken ?? null,
    expiresAt,
    email: input.email ?? null,
  };
}
