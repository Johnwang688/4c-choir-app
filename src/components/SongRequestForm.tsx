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

function IconChevron({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function SongRequestForm() {
  const [isOpen, setIsOpen] = useState(false);
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
        setMessage(data.error ?? "Submission failed. Please try again later.");
        setIsOpen(true);
        return;
      }

      setStatus("success");
      setMessage("We received your request. Thank you!");
      setName("");
      setEmail("");
      setSongTitle("");
      setRemarks("");
      setIsOpen(true);
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again later.");
      setIsOpen(true);
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6">
      <div className="glass-panel rounded-[1.8rem] p-5 sm:p-6">
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-4 text-left"
          aria-expanded={isOpen}
          aria-controls="song-request-form-panel"
        >
          <div>
            <h2 className="metallic-text text-lg font-semibold sm:text-xl">
              请求歌曲
            </h2>
            {!isOpen ? (
              <p className="mt-2 text-sm leading-relaxed text-violet-100/72">
                如果歌单里没有你想要的歌，可以在这里提交请求。
              </p>
            ) : null}
          </div>
          <span className="glass-chip inline-flex size-10 shrink-0 items-center justify-center rounded-full text-violet-50">
            <IconChevron className={isOpen ? "size-5 rotate-180" : "size-5"} />
          </span>
        </button>

        {isOpen ? (
          <div id="song-request-form-panel" className="mt-4">
            <p className="text-sm leading-relaxed text-violet-100/72">
              如果列表里没有你想唱的歌，请提交请求，我们会尽量补充乐谱和参考链接。
            </p>

            <form className="mt-8 flex flex-col gap-5" onSubmit={onSubmit}>
              <div>
                <label
                  htmlFor="sr-name"
                  className="mb-1.5 block text-sm font-medium text-violet-50"
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
                  className="crystal-input w-full rounded-xl px-4 py-3 text-[15px] outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="sr-email"
                  className="mb-1.5 block text-sm font-medium text-violet-50"
                >
                  Email
                </label>
                <div className="relative">
                  <IconMail className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-violet-100/52" />
                  <input
                    id="sr-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="crystal-input w-full rounded-xl py-3 pl-11 pr-4 text-[15px] outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="sr-song"
                  className="mb-1.5 block text-sm font-medium text-violet-50"
                >
                  歌曲名称 <span className="text-red-300">*</span>
                </label>
                <input
                  id="sr-song"
                  name="songTitle"
                  type="text"
                  required
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  className="crystal-input w-full rounded-xl px-4 py-3 text-[15px] outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="sr-remarks"
                  className="mb-1.5 block text-sm font-medium text-violet-50"
                >
                  备注或建议
                </label>
                <textarea
                  id="sr-remarks"
                  name="remarks"
                  rows={4}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="crystal-input w-full resize-y rounded-xl px-4 py-3 text-[15px] outline-none"
                />
              </div>

              {message ? (
                <p
                  className={
                    status === "success"
                      ? "text-sm font-medium text-emerald-200"
                      : "text-sm font-medium text-rose-200"
                  }
                  role="status"
                >
                  {message}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={status === "loading"}
                className="amethyst-button mt-1 w-full rounded-full py-3.5 text-[15px] font-medium disabled:cursor-not-allowed"
              >
                {status === "loading" ? "提交中..." : "提交请求"}
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </section>
  );
}
