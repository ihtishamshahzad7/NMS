"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Client-side search box for a table whose rows are already server-
 * rendered. IMPORTANT: this component takes no function props — only
 * plain data (`searchIndex`) and already-rendered JSX (`children`).
 * Next.js Server Components can pass plain data across the server/client
 * boundary but never functions, so an earlier version of this component
 * (which took `searchFields`/`children` as callbacks) crashed every page
 * that used it in production with "Functions cannot be passed directly to
 * Client Components". This version filters by hiding/showing already-
 * rendered <tr> elements via a plain string index instead.
 */
export function FilterableTable({
  searchIndex,
  placeholder = "Filter…",
  children,
}: {
  /** One lowercased searchable string per table row, in the SAME ORDER
   * the rows appear in `children`'s <tbody>. */
  searchIndex: string[];
  placeholder?: string;
  children: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(searchIndex.length);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    const table = containerRef.current?.querySelector("table");
    const rows = table ? Array.from(table.querySelectorAll("tbody > tr")) : [];

    let shown = 0;
    rows.forEach((row, i) => {
      // Rows beyond searchIndex's length (e.g. a static "no data" row)
      // are left alone — they're not part of what we're filtering.
      if (i >= searchIndex.length) return;
      const matches = !q || searchIndex[i].includes(q);
      (row as HTMLElement).style.display = matches ? "" : "none";
      if (matches) shown++;
    });
    setVisibleCount(q ? shown : searchIndex.length);
  }, [query, searchIndex]);

  return (
    <div className="flex flex-col gap-3" ref={containerRef}>
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
            {visibleCount} / {searchIndex.length}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
