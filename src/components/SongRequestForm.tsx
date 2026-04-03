"use client";

import { useState } from "react";

function IconMail({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function SongRequestForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/song-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, songTitle, remarks }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "提交失败，请稍后再试。");
        return;
      }

      setStatus("success");
      setMessage("已收到你的请求，谢谢！");
      setName("");
      setEmail("");
      setSongTitle("");
      setRemarks("");
    } catch {
      setStatus("error");
      setMessage("网络错误，请稍后再试。");
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6">
      <div className="rounded-2xl border border-zinc-200/90 bg-zinc-100/80 p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-zinc-900 sm:text-xl">
          共同打造德州乐谱共享中心
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          你的反馈能帮助我们改进平台，让敬拜排练更顺畅。若列表里没有你想唱的歌，请填写下方表单，我们会尽量补充乐谱与参考。
        </p>

        <form className="mt-8 flex flex-col gap-5" onSubmit={onSubmit}>
          <div>
            <label
              htmlFor="sr-name"
              className="mb-1.5 block text-sm font-medium text-zinc-800"
            >
              你的称呼
            </label>
            <input
              id="sr-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-zinc-200/80 bg-zinc-200/50 px-4 py-3 text-[15px] text-zinc-900 outline-none ring-zinc-400/20 placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-4"
            />
          </div>

          <div>
            <label
              htmlFor="sr-email"
              className="mb-1.5 block text-sm font-medium text-zinc-800"
            >
              Email
            </label>
            <div className="relative">
              <IconMail className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-zinc-400" />
              <input
                id="sr-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-200/80 bg-zinc-200/50 py-3 pl-11 pr-4 text-[15px] text-zinc-900 outline-none ring-zinc-400/20 placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-4"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="sr-song"
              className="mb-1.5 block text-sm font-medium text-zinc-800"
            >
              你想找的歌名 <span className="text-red-600">*</span>
            </label>
            <input
              id="sr-song"
              name="songTitle"
              type="text"
              required
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              className="w-full rounded-xl border border-zinc-200/80 bg-zinc-200/50 px-4 py-3 text-[15px] text-zinc-900 outline-none ring-zinc-400/20 placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-4"
            />
          </div>

          <div>
            <label
              htmlFor="sr-remarks"
              className="mb-1.5 block text-sm font-medium text-zinc-800"
            >
              备注或者建议
            </label>
            <textarea
              id="sr-remarks"
              name="remarks"
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full resize-y rounded-xl border border-zinc-200/80 bg-zinc-200/50 px-4 py-3 text-[15px] text-zinc-900 outline-none ring-zinc-400/20 placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-4"
            />
          </div>

          {message ? (
            <p
              className={
                status === "success"
                  ? "text-sm font-medium text-emerald-700"
                  : "text-sm font-medium text-red-600"
              }
              role="status"
            >
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={status === "loading"}
            className="mt-1 w-full rounded-full bg-zinc-900 py-3.5 text-[15px] font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" ? "提交中…" : "提交请求"}
          </button>
        </form>
      </div>
    </section>
  );
}
