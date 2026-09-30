const SEVERITY_MAP: Record<string, { color: string; label: string }> = {
  CRITICAL: { color: "var(--status-down)", label: "Critical" },
  MAJOR: { color: "var(--status-down)", label: "Major" },
  MINOR: { color: "var(--status-warning)", label: "Minor" },
  WARNING: { color: "var(--status-warning)", label: "Warning" },
  NORMAL: { color: "var(--status-up)", label: "Normal" },
  CLEARED: { color: "var(--status-up)", label: "Cleared" },
  INDETERMINATE: { color: "var(--status-unknown)", label: "Unknown" },
};

export function StatusPill({ severity }: { severity?: string }) {
  const key = (severity ?? "INDETERMINATE").toUpperCase();
  const cfg = SEVERITY_MAP[key] ?? SEVERITY_MAP.INDETERMINATE;
  const isDown = key === "CRITICAL" || key === "MAJOR";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: `${cfg.color}1f`, color: cfg.color }}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${isDown ? "pulse-down" : ""}`}
        style={{ background: cfg.color }}
      />
      {cfg.label}
    </span>
  );
}
