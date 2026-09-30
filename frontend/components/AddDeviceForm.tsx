"use client";

import { useRef, useState, useTransition } from "react";
import { addDeviceAction } from "@/app/(noc)/provisioning/actions";

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--border-subtle)",
  background: "var(--bg-page)",
  color: "var(--text-primary)",
};

export function AddDeviceForm({ defaultForeignSource }: { defaultForeignSource: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await addDeviceAction(formData);
      if (result.ok) {
        setMessage({
          kind: "ok",
          text: result.imported
            ? "Device added and imported — it should appear in Nodes shortly."
            : "Device added to the requisition. Go to Provisioning and click Import to bring it into live inventory.",
        });
        formRef.current?.reset();
      } else {
        setMessage({ kind: "error", text: result.error });
      }
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="glass-card flex flex-col gap-4 p-5"
    >
      <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        Add Device
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
          Foreign Source (device group)
          <input
            name="foreignSource"
            defaultValue={defaultForeignSource}
            required
            className="rounded-md px-3 py-2 text-sm"
            style={inputStyle}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
          Device Label
          <input
            name="label"
            placeholder="core-switch-01"
            required
            className="rounded-md px-3 py-2 text-sm"
            style={inputStyle}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
          IP Address
          <input
            name="ip"
            placeholder="10.0.0.1"
            required
            pattern="^(\d{1,3}\.){3}\d{1,3}$"
            title="IPv4 address, e.g. 10.0.0.1"
            className="rounded-md px-3 py-2 text-sm"
            style={inputStyle}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
          SNMP Community
          <input
            name="community"
            placeholder="public"
            className="rounded-md px-3 py-2 text-sm"
            style={inputStyle}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
          SNMP Version
          <select name="version" defaultValue="v2c" className="rounded-md px-3 py-2 text-sm" style={inputStyle}>
            <option value="v1">v1</option>
            <option value="v2c">v2c</option>
          </select>
        </label>

        <label className="flex items-end gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <input type="checkbox" name="autoImport" defaultChecked className="h-4 w-4" />
          Import immediately
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-60"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          {isPending ? "Adding…" : "Add Device"}
        </button>
        {message && (
          <span
            className="text-xs"
            style={{ color: message.kind === "ok" ? "var(--status-up)" : "var(--status-warning)" }}
          >
            {message.text}
          </span>
        )}
      </div>

      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        SNMP version v3 isn&apos;t supported by this form yet — add v3 devices through the
        classic admin console, or ask to have v3 added here.
      </p>
    </form>
  );
}
