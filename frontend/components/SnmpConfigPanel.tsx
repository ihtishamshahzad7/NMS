"use client";

import { useState, useTransition } from "react";
import { saveSnmpConfigAction } from "@/app/(noc)/provisioning/actions";

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--border-subtle)",
  background: "var(--bg-page)",
  color: "var(--text-primary)",
};

export function SnmpConfigPanel({
  ip,
  initialCommunity,
  initialVersion,
}: {
  ip: string;
  initialCommunity?: string;
  initialVersion?: string;
}) {
  const [community, setCommunity] = useState(initialCommunity ?? "");
  const [version, setVersion] = useState(initialVersion ?? "v2c");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveSnmpConfigAction(ip, community, version);
      setMessage(
        result.ok
          ? { kind: "ok", text: "Saved — takes effect on the next poll/collection cycle." }
          : { kind: "error", text: result.error }
      );
    });
  }

  return (
    <div className="flex flex-col gap-3 p-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
          IP Address
          <input value={ip} disabled className="rounded-md px-3 py-2 text-sm opacity-60" style={inputStyle} />
        </label>
        <label className="flex flex-col gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
          Community
          <input
            value={community}
            onChange={(e) => setCommunity(e.target.value)}
            placeholder="public"
            className="rounded-md px-3 py-2 text-sm"
            style={inputStyle}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
          Version
          <select
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="rounded-md px-3 py-2 text-sm"
            style={inputStyle}
          >
            <option value="v1">v1</option>
            <option value="v2c">v2c</option>
          </select>
        </label>
        <button
          type="button"
          onClick={save}
          disabled={isPending || !community}
          className="rounded-md px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-60"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
      {message && (
        <span
          className="text-xs"
          style={{ color: message.kind === "ok" ? "var(--status-up)" : "var(--status-warning)" }}
        >
          {message.text}
        </span>
      )}
    </div>
  );
}
