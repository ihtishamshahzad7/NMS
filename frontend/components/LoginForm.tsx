"use client";

import { useActionState } from "react";
import { login } from "@/app/login/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="rounded-md border px-3 py-2 text-sm outline-none"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--bg-page)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-md border px-3 py-2 text-sm outline-none"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--bg-page)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {state?.error && (
        <div className="rounded-md px-3 py-2 text-xs" style={{ background: "rgba(239,68,68,0.12)", color: "var(--status-down)" }}>
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-md py-2 text-sm font-medium text-white transition-opacity disabled:opacity-60"
        style={{ background: `linear-gradient(135deg, var(--accent), var(--accent-strong))` }}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
