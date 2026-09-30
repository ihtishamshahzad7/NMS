"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const LINE_COLORS = ["#3e8fff", "#22c55e", "#f59e0b", "#ef4444", "#a855f7"];

export function ResourceChart({
  labels,
  points,
}: {
  labels: string[];
  points: { timestamp: number; values: (number | null)[] }[];
}) {
  const data = points.map((p) => {
    const row: Record<string, number | null | string> = {
      time: new Date(p.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    labels.forEach((label, i) => {
      row[label] = p.values[i];
    });
    return row;
  });

  if (data.length === 0) {
    return (
      <div
        className="flex h-72 items-center justify-center text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        No data points returned for this window yet.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="time"
            stroke="var(--text-muted)"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "var(--border-subtle)" }}
          />
          <YAxis
            stroke="var(--text-muted)"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={56}
          />
          <Tooltip
            contentStyle={{
              background: "var(--bg-surface-raised)",
              border: "1px solid var(--border-strong)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--text-secondary)" }}
          />
          {labels.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {labels.map((label, i) => (
            <Line
              key={label}
              type="monotone"
              dataKey={label}
              stroke={LINE_COLORS[i % LINE_COLORS.length]}
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
