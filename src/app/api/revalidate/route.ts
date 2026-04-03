import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const SONGS_TAG = "songs";

function isAuthorized(request: NextRequest, secret: string): boolean {
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  if (request.headers.get("x-revalidate-secret") === secret) return true;
  if (request.nextUrl.searchParams.get("secret") === secret) return true;
  return false;
}

/** Marks cached song data stale so the next visit refetches (stale-while-revalidate). */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "REVALIDATE_SECRET is not configured" },
      { status: 503 },
    );
  }

  if (!isAuthorized(request, secret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag(SONGS_TAG, "max");
  return NextResponse.json({ ok: true, tag: SONGS_TAG });
}

/** Same as POST for tools that only issue GET (e.g. some “ping URL” monitors). */
export async function GET(request: NextRequest) {
  return POST(request);
}
