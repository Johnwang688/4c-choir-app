"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type AuthMode = "sign-in" | "sign-up";

type SessionState = {
  authenticated: boolean;
  email: string | null;
};

function pickMessage(data: unknown, fallback: string) {
  if (typeof data === "object" && data && "error" in data) {
    const message = (data as { error?: unknown }).error;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (typeof data === "object" && data && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

export function AuthButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [session, setSession] = useState<SessionState>({
    authenticated: false,
    email: null,
  });

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        const data = (await response.json()) as {
          authenticated?: boolean;
          user?: { email?: string | null };
        };

        setSession({
          authenticated: Boolean(data.authenticated),
          email: data.user?.email ?? null,
        });
      } catch {
        setSession({
          authenticated: false,
          email: null,
        });
      }
    }

    void loadSession();
  }, []);

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        mode === "sign-in" ? "/api/auth/sign-in" : "/api/auth/sign-up",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        needsEmailConfirmation?: boolean;
        user?: { email?: string | null };
      };

      if (!response.ok) {
        setError(
          pickMessage(
            data,
            mode === "sign-in"
              ? "Unable to sign in right now."
              : "Unable to create your account right now.",
          ),
        );
        setStatus("idle");
        return;
      }

      setMessage(
        data.message ??
          (mode === "sign-in"
            ? "You are signed in."
            : "Your account has been created."),
      );
      setPassword("");

      if (data.needsEmailConfirmation) {
        setMode("sign-in");
      } else {
        window.location.reload();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setStatus("idle");
    }
  }

  async function signOut() {
    setStatus("loading");
    setMessage("");
    setError("");

    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      window.location.reload();
    } catch {
      setError("Unable to sign out right now.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {session.authenticated && session.email ? (
          <p className="hidden text-sm text-stone-600 sm:block">{session.email}</p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setError("");
            setMessage("");
            setIsOpen(true);
          }}
          className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:border-rose-300 hover:bg-rose-100"
        >
          {session.authenticated ? "Account" : "Sign in"}
        </button>
      </div>

      {isOpen
        ? createPortal(
            <div className="fixed inset-0 z-[200] overflow-y-auto bg-stone-950/35 px-4 py-8 sm:px-6">
          <div className="flex min-h-full items-center justify-center">
            <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl sm:p-8">
              <div className="flex items-center justify-between gap-3">
                {session.authenticated ? (
                  <p className="min-w-0 truncate text-sm font-medium text-stone-900">
                    {session.email}
                  </p>
                ) : (
                  <div className="inline-flex rounded-full bg-stone-100 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("sign-in");
                        setError("");
                        setMessage("");
                      }}
                      className={
                        mode === "sign-in"
                          ? "rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-900 shadow-sm"
                          : "rounded-full px-4 py-2 text-sm font-medium text-stone-500"
                      }
                    >
                      Sign in
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("sign-up");
                        setError("");
                        setMessage("");
                      }}
                      className={
                        mode === "sign-up"
                          ? "rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-900 shadow-sm"
                          : "rounded-full px-4 py-2 text-sm font-medium text-stone-500"
                      }
                    >
                      Create account
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
                  aria-label="Close auth dialog"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-[18px]"
                    aria-hidden
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {session.authenticated ? (
                <div className="mt-6 space-y-4">
                  {error ? (
                    <p className="text-sm font-medium text-red-600">{error}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    disabled={status === "loading"}
                    className="w-full rounded-full bg-stone-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === "loading" ? "Signing out..." : "Sign out"}
                  </button>
                </div>
              ) : (
                <form className="mt-6 space-y-4" onSubmit={submitForm}>
                  <div>
                    <label
                      htmlFor="auth-email"
                      className="mb-1.5 block text-sm font-medium text-stone-800"
                    >
                      Email
                    </label>
                    <input
                      id="auth-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-[15px] text-stone-900 outline-none ring-rose-500/15 focus:border-rose-300 focus:ring-4"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="auth-password"
                      className="mb-1.5 block text-sm font-medium text-stone-800"
                    >
                      Password
                    </label>
                    <input
                      id="auth-password"
                      type="password"
                      autoComplete={
                        mode === "sign-in" ? "current-password" : "new-password"
                      }
                      required
                      minLength={6}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-[15px] text-stone-900 outline-none ring-rose-500/15 placeholder:text-stone-400 focus:border-rose-300 focus:ring-4"
                    />
                  </div>

                  {message ? (
                    <p className="text-sm font-medium text-emerald-700">{message}</p>
                  ) : null}
                  {error ? (
                    <p className="text-sm font-medium text-red-600">{error}</p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full rounded-full bg-stone-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === "loading"
                      ? mode === "sign-in"
                        ? "Signing in..."
                        : "Creating account..."
                      : mode === "sign-in"
                        ? "Sign in"
                        : "Create account"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>,
            document.body,
          )
        : null}
    </>
  );
}
