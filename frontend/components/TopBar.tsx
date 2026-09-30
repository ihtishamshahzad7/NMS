import { Search, Bell } from "lucide-react";

export function TopBar({ title }: { title: string }) {
  return (
    <header
      className="flex h-16 shrink-0 items-center justify-between border-b px-6"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
        {title}
      </h1>
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
        >
          <Search size={14} />
          <span>Search nodes, alarms…</span>
        </div>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-md border"
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
        >
          <Bell size={16} />
        </button>
      </div>
    </header>
  );
}
