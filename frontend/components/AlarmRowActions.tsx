"use client";

import { useState, useTransition } from "react";
import {
  acknowledgeAlarmAction,
  clearAlarmAction,
  escalateAlarmAction,
} from "@/app/(noc)/alarms/actions";

export function AlarmRowActions({
  alarmId,
  acked,
}: {
  alarmId: number;
  acked: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Action failed");
    });
  }

  const btnStyle: React.CSSProperties = {
    color: "var(--text-secondary)",
    border: "1px solid var(--border-subtle)",
    background: "transparent",
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => acknowledgeAlarmAction(alarmId, !acked))}
          className="rounded-md px-2 py-1 text-xs font-medium transition-opacity disabled:opacity-50"
          style={btnStyle}
        >
          {acked ? "Unack" : "Ack"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => escalateAlarmAction(alarmId))}
          className="rounded-md px-2 py-1 text-xs font-medium transition-opacity disabled:opacity-50"
          style={btnStyle}
        >
          Escalate
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => clearAlarmAction(alarmId))}
          className="rounded-md px-2 py-1 text-xs font-medium transition-opacity disabled:opacity-50"
          style={{ ...btnStyle, color: "var(--status-up)" }}
        >
          Clear
        </button>
      </div>
      {error && (
        <span className="text-xs" style={{ color: "var(--status-warning)" }}>
          {error}
        </span>
      )}
    </div>
  );
}
