"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NAV } from "@/lib/brand";

type Flat = { label: string; href: string; group: string };

/**
 * Cmd/Ctrl+K quick nav across every screen. Pure client-side routing over
 * the same NAV list the sidebar renders from — no API calls, so there's
 * nothing here to get wrong against a real backend.
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<Flat[]>(
    () => NAV.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label }))),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) => item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={() => setOpen(false)}
    >
      <div
        className="glass-card w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ border: "1px solid var(--border-subtle)" }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && filtered[activeIndex]) {
              go(filtered[activeIndex].href);
            }
          }}
          placeholder="Jump to a screen…"
          className="w-full border-b px-4 py-3 text-sm outline-none"
          style={{
            borderColor: "var(--border-subtle)",
            background: "transparent",
            color: "var(--text-primary)",
          }}
        />
        <div className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              No matching screens.
            </div>
          )}
          {filtered.map((item, idx) => (
            <button
              key={item.href}
              onClick={() => go(item.href)}
              onMouseEnter={() => setActiveIndex(idx)}
              className="flex w-full items-center justify-between px-4 py-2 text-left text-sm"
              style={{
                background: idx === activeIndex ? "var(--accent-soft)" : "transparent",
                color: "var(--text-primary)",
              }}
            >
              <span>{item.label}</span>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {item.group}
              </span>
            </button>
          ))}
        </div>
        <div
          className="border-t px-4 py-2 text-[11px]"
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
        >
          ↑↓ to navigate · Enter to select · Esc to close
        </div>
      </div>
    </div>
  );
}
