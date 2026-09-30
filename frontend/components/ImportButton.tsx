"use client";

import { useState, useTransition } from "react";
import { RefreshCw, Check, AlertCircle } from "lucide-react";
import { runImport } from "@/app/(noc)/provisioning/actions";

export function ImportButton({ foreignSource }: { foreignSource: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<"ok" | "error" | null>(null);

  const handleClick = () => {
    setResult(null);
    startTransition(async () => {
      const res = await runImport(foreignSource);
      setResult(res.ok ? "ok" : "error");
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60"
      style={{
        borderColor: "var(--border-subtle)",
        color: result === "error" ? "var(--status-down)" : "var(--accent)",
        background: "var(--accent-soft)",
      }}
    >
      {pending ? (
        <RefreshCw size={12} className="animate-spin" />
      ) : result === "ok" ? (
        <Check size={12} />
      ) : result === "error" ? (
        <AlertCircle size={12} />
      ) : (
        <RefreshCw size={12} />
      )}
      {pending ? "Importing…" : result === "ok" ? "Imported" : result === "error" ? "Failed — retry" : "Import now"}
    </button>
  );
}
