"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type AuthMode = "sign-in" | "sign-up";
type AccountMode = "overview" | "change-password";

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
  const [accountMode, setAccountMode] = useState<AccountMode>("overview");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  async function submitPasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      setMessage("");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      setMessage("");
      return;
    }

    setStatus("loading");
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        setError(
          pickMessage(data, "Unable to change your password right now."),
        );
        setStatus("idle");
        return;
      }

      setMessage(data.message ?? "Your password has been updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setAccountMode("overview");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {session.authenticated && session.email ? (
          <p className="hidden text-sm text-violet-100/72 sm:block">{session.email}</p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setError("");
            setMessage("");
            setAccountMode("overview");
            setIsOpen(true);
          }}
          className="glass-chip rounded-full px-4 py-2 text-sm font-medium text-violet-50 hover:text-white"
        >
          {session.authenticated ? "Account" : "Sign in"}
        </button>
      </div>

      {isOpen
        ? createPortal(
            <div className="fixed inset-0 z-[200] overflow-y-auto bg-[#09030f]/48 px-4 py-8 backdrop-blur-md sm:px-6">
              <div className="flex min-h-full items-center justify-center">
                <div className="glass-panel w-full max-w-md rounded-[2rem] p-6 shadow-2xl sm:p-8">
                  <div className="flex items-center justify-between gap-3">
                    {session.authenticated ? (
                      <p className="min-w-0 truncate text-sm font-medium text-violet-50">
                        {session.email}
                      </p>
                    ) : (
                      <div className="glass-chip inline-flex rounded-full p-1">
                        <button
                          type="button"
                          onClick={() => {
                            setMode("sign-in");
                            setError("");
                            setMessage("");
                            setPassword("");
                          }}
                          className={
                            mode === "sign-in"
                              ? "rounded-full bg-white/18 px-4 py-2 text-sm font-medium text-white shadow-sm"
                              : "rounded-full px-4 py-2 text-sm font-medium text-violet-100/64"
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
                            setPassword("");
                          }}
                          className={
                            mode === "sign-up"
                              ? "rounded-full bg-white/18 px-4 py-2 text-sm font-medium text-white shadow-sm"
                              : "rounded-full px-4 py-2 text-sm font-medium text-violet-100/64"
                          }
                        >
                          Create account
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-violet-100/68 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-200/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a0b2f]"
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
                        <p className="text-sm font-medium text-rose-200">{error}</p>
                      ) : null}
                      {message ? (
                        <p className="text-sm font-medium text-emerald-200">{message}</p>
                      ) : null}

                      {accountMode === "change-password" ? (
                        <form className="space-y-4" onSubmit={submitPasswordChange}>
                          <div>
                            <label
                              htmlFor="auth-current-password"
                              className="mb-1.5 block text-sm font-medium text-violet-50"
                            >
                              Current password
                            </label>
                            <input
                              id="auth-current-password"
                              type="password"
                              autoComplete="current-password"
                              required
                              minLength={6}
                              value={currentPassword}
                              onChange={(event) =>
                                setCurrentPassword(event.target.value)
                              }
                              className="crystal-input w-full rounded-xl px-4 py-3 text-[15px] outline-none"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="auth-new-password"
                              className="mb-1.5 block text-sm font-medium text-violet-50"
                            >
                              New password
                            </label>
                            <input
                              id="auth-new-password"
                              type="password"
                              autoComplete="new-password"
                              required
                              minLength={6}
                              value={newPassword}
                              onChange={(event) => setNewPassword(event.target.value)}
                              className="crystal-input w-full rounded-xl px-4 py-3 text-[15px] outline-none"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="auth-confirm-password"
                              className="mb-1.5 block text-sm font-medium text-violet-50"
                            >
                              Confirm new password
                            </label>
                            <input
                              id="auth-confirm-password"
                              type="password"
                              autoComplete="new-password"
                              required
                              minLength={6}
                              value={confirmPassword}
                              onChange={(event) =>
                                setConfirmPassword(event.target.value)
                              }
                              className="crystal-input w-full rounded-xl px-4 py-3 text-[15px] outline-none"
                            />
                          </div>

                          <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                              type="submit"
                              disabled={status === "loading"}
                              className="amethyst-button w-full rounded-full px-4 py-3 text-sm font-medium disabled:cursor-not-allowed"
                            >
                              {status === "loading"
                                ? "Updating password..."
                                : "Update password"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAccountMode("overview");
                                setCurrentPassword("");
                                setNewPassword("");
                                setConfirmPassword("");
                                setError("");
                              }}
                              disabled={status === "loading"}
                              className="glass-chip w-full rounded-full px-4 py-3 text-sm font-medium text-violet-50 disabled:cursor-not-allowed"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-3">
                          <button
                            type="button"
                            onClick={() => {
                              setAccountMode("change-password");
                              setError("");
                              setMessage("");
                            }}
                            disabled={status === "loading"}
                            className="glass-chip w-full rounded-full px-4 py-3 text-sm font-medium text-violet-50 disabled:cursor-not-allowed"
                          >
                            Change password
                          </button>
                          <button
                            type="button"
                            onClick={() => void signOut()}
                            disabled={status === "loading"}
                            className="amethyst-button w-full rounded-full px-4 py-3 text-sm font-medium disabled:cursor-not-allowed"
                          >
                            {status === "loading" ? "Signing out..." : "Sign out"}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <form className="mt-6 space-y-4" onSubmit={submitForm}>
                      <div>
                        <label
                          htmlFor="auth-email"
                          className="mb-1.5 block text-sm font-medium text-violet-50"
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
                          className="crystal-input w-full rounded-xl px-4 py-3 text-[15px] outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="auth-password"
                          className="mb-1.5 block text-sm font-medium text-violet-50"
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
                          className="crystal-input w-full rounded-xl px-4 py-3 text-[15px] outline-none"
                        />
                      </div>

                      {message ? (
                        <p className="text-sm font-medium text-emerald-200">{message}</p>
                      ) : null}
                      {error ? (
                        <p className="text-sm font-medium text-rose-200">{error}</p>
                      ) : null}

                      <button
                        type="submit"
                        disabled={status === "loading"}
                        className="amethyst-button w-full rounded-full px-4 py-3 text-sm font-medium disabled:cursor-not-allowed"
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
