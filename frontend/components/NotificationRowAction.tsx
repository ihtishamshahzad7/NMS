"use client";

import { useState, useTransition } from "react";
import { acknowledgeNotificationAction } from "@/app/(noc)/notifications/actions";

export function NotificationRowAction({ notificationId }: { notificationId: number }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function ack() {
    setError(null);
    startTransition(async () => {
      const result = await acknowledgeNotificationAction(notificationId);
      if (!result.ok) setError(result.error ?? "Acknowledge failed");
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={ack}
        className="rounded-md px-2 py-1 text-xs font-medium transition-opacity disabled:opacity-50"
        style={{
          color: "var(--text-secondary)",
          border: "1px solid var(--border-subtle)",
          background: "transparent",
        }}
      >
        Acknowledge
      </button>
      {error && (
        <span className="text-xs" style={{ color: "var(--status-warning)" }}>
          {error}
        </span>
      )}
    </div>
  );
}
