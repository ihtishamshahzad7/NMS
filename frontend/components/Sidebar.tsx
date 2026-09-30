"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  LayoutDashboard,
  Server,
  AlertTriangle,
  Activity,
  PlugZap,
  LineChart,
  Share2,
  PlusSquare,
  Bell,
  Users,
  Boxes,
  Cable,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { BRAND, NAV } from "@/lib/brand";
import { logout } from "@/app/login/actions";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Server,
  AlertTriangle,
  Activity,
  PlugZap,
  LineChart,
  Share2,
  PlusSquare,
  Bell,
  Users,
  Boxes,
  Cable,
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logout();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <aside
      className="hidden md:flex w-64 shrink-0 flex-col gap-6 border-r px-4 py-6 scrollbar-thin overflow-y-auto"
      style={{ borderColor: "var(--border-subtle)", background: "var(--bg-page)" }}
    >
      <div className="flex items-center gap-3 px-2">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: `linear-gradient(135deg, var(--accent-soft), transparent)`,
          }}
        >
          <Image
            src="/logo-icon.png"
            alt={`${BRAND.name} logo`}
            width={28}
            height={28}
            priority
          />
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {BRAND.name}
          </div>
          <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {BRAND.tagline}
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-6">
        {NAV.map((group) => (
          <div key={group.label}>
            <div
              className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              {group.label}
            </div>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = ICONS[item.icon] ?? Server;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors"
                    style={{
                      color: active ? "var(--text-primary)" : "var(--text-secondary)",
                      background: active ? "var(--accent-soft)" : "transparent",
                    }}
                  >
                    <Icon size={16} strokeWidth={2} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3 px-2">
        <button
          type="button"
          onClick={handleLogout}
          disabled={pending}
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors disabled:opacity-60"
          style={{ color: "var(--text-secondary)" }}
        >
          <LogOut size={16} strokeWidth={2} />
          {pending ? "Signing out…" : "Sign out"}
        </button>
        <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {BRAND.name} · All systems monitored
        </div>
      </div>
    </aside>
  );
}
