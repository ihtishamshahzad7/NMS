export function StatCard({
  label,
  value,
  accentColor,
}: {
  label: string;
  value: string | number;
  accentColor?: string;
}) {
  return (
    <div className="glass-card p-5">
      <div className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div
        className="mt-2 text-3xl font-semibold"
        style={{ color: accentColor ?? "var(--text-primary)" }}
      >
        {value}
      </div>
    </div>
  );
}
