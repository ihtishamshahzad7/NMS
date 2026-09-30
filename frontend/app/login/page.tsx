import { LoginForm } from "@/components/LoginForm";
import { BRAND } from "@/lib/brand";

export default function LoginPage() {
  return (
    <div className="app-shell flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          {/* Full lockup (icon + wordmark + tagline) — the one place in the
              app this asset is used, since it's the only screen with room
              for it without crowding a small badge. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-full.png" alt={BRAND.name} className="h-40 w-40 object-contain" />
        </div>

        <div className="glass-card p-6">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          Sign in with the same credentials used on the classic web console.
        </p>
      </div>
    </div>
  );
}
