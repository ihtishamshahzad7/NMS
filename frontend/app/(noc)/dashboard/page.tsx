import { TopBar } from "@/components/TopBar";
import { StatCard } from "@/components/StatCard";
import { StatusPill } from "@/components/StatusPill";
import { opennms } from "@/lib/opennms-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Each call is independent and fails softly — one slow/unavailable
  // OpenNMS endpoint shouldn't blank the whole dashboard.
  const [nodesRes, alarmsRes, outagesRes] = await Promise.allSettled([
    opennms.listNodes(1),
    opennms.listAlarms(8),
    opennms.listOutages(1),
  ]);

  const nodeCount = nodesRes.status === "fulfilled" ? nodesRes.value.count : "—";
  const alarmCount = alarmsRes.status === "fulfilled" ? alarmsRes.value.count : "—";
  const outageCount = outagesRes.status === "fulfilled" ? outagesRes.value.count : "—";
  const recentAlarms = alarmsRes.status === "fulfilled" ? alarmsRes.value.alarms : [];
  const connectionFailed = nodesRes.status === "rejected" && alarmsRes.status === "rejected";

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="flex flex-col gap-6 p-6">
        {connectionFailed && (
          <div
            className="glass-card p-4 text-sm"
            style={{ color: "var(--status-warning)" }}
          >
            Couldn&apos;t reach the OpenNMS API yet. Set OPENNMS_BASE_URL / OPENNMS_USER /
            OPENNMS_PASSWORD in .env.local and point it at a running instance — the layout
            below will populate as soon as it connects.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Monitored Nodes" value={nodeCount} />
          <StatCard
            label="Active Alarms"
            value={alarmCount}
            accentColor={Number(alarmCount) > 0 ? "var(--status-warning)" : undefined}
          />
          <StatCard
            label="Current Outages"
            value={outageCount}
            accentColor={Number(outageCount) > 0 ? "var(--status-down)" : undefined}
          />
          <StatCard label="Engine" value="OpenNMS" />
        </div>

        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--border-subtle)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Recent Alarms
            </h2>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Node</th>
                <th>Message</th>
                <th>Last Event</th>
              </tr>
            </thead>
            <tbody>
              {recentAlarms.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center" style={{ color: "var(--text-muted)" }}>
                    No alarms to show yet.
                  </td>
                </tr>
              )}
              {recentAlarms.map((a) => (
                <tr key={a.id}>
                  <td>
                    <StatusPill severity={a.severityLabel} />
                  </td>
                  <td style={{ color: "var(--text-primary)" }}>{a.nodeLabel ?? "—"}</td>
                  <td style={{ color: "var(--text-secondary)" }} className="max-w-md truncate">
                    {a.logMsg?.content ?? "—"}
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {a.lastEventTime ? new Date(a.lastEventTime).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
