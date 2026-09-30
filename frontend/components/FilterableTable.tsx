"use client";

import { useMemo, useState } from "react";

/**
 * Generic client-side search box for a table whose rows are already
 * server-fetched. No new API calls, no server round-trip — just filters
 * the array already in the page by a simple case-insensitive substring
 * match across whichever fields the caller points at.
 */
export function FilterableTable<T>({
  rows,
  searchFields,
  placeholder = "Filter…",
  children,
}: {
  rows: T[];
  searchFields: (row: T) => (string | number | undefined | null)[];
  placeholder?: string;
  children: (filtered: T[]) => React.ReactNode;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      searchFields(row).some((field) => String(field ?? "").toLowerCase().includes(q))
    );
  }, [rows, query, searchFields]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full max-w-xs rounded-md border px-3 py-1.5 text-sm outline-none transition-colors sm:w-64"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--bg-page)",
            color: "var(--text-primary)",
          }}
        />
        {query && (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {filtered.length} / {rows.length}
          </span>
        )}
      </div>
      {children(filtered)}
    </div>
  );
}
