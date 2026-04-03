import { NextResponse } from "next/server";

const MAX_LEN = {
  name: 120,
  email: 254,
  songTitle: 300,
  remarks: 2000,
} as const;

type Body = {
  name?: unknown;
  email?: unknown;
  songTitle?: unknown;
  remarks?: unknown;
};

function trim(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, max);
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = trim(body.name, MAX_LEN.name);
  const email = trim(body.email, MAX_LEN.email);
  const songTitle = trim(body.songTitle, MAX_LEN.songTitle);
  const remarks = trim(body.remarks, MAX_LEN.remarks);

  if (!songTitle) {
    return NextResponse.json(
      { error: "歌名为必填项。" },
      { status: 400 },
    );
  }

  const payload = {
    name,
    email,
    songTitle,
    remarks,
    submittedAt: new Date().toISOString(),
  };

  const webhook = process.env.SONG_REQUEST_WEBHOOK_URL;
  if (!webhook) {
    return NextResponse.json(
      {
        error:
          "服务器未配置接收地址。请在环境变量 SONG_REQUEST_WEBHOOK_URL 中设置你的 Webhook（如 Airtable、Make、Zapier 等）。",
      },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "提交失败，请稍后再试。" },
        { status: 502 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "网络错误，请稍后再试。" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
