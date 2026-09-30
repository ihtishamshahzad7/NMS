import { TopBar } from "@/components/TopBar";
import { StatusPill } from "@/components/StatusPill";
import { FilterableTable } from "@/components/FilterableTable";
import { AlarmRowActions } from "@/components/AlarmRowActions";
import { routingnms } from "@/lib/routingnms-client";

export const dynamic = "force-dynamic";

export default async function AlarmsPage() {
  let alarms: Awaited<ReturnType<typeof routingnms.listAlarms>>["alarms"] = [];
  let error: string | null = null;

  try {
    const res = await routingnms.listAlarms(200);
    alarms = res.alarms;
  } catch {
    error = "Couldn't reach the RoutingNMS API. Check ROUTINGNMS_API_URL / credentials.";
  }

  const searchIndex = alarms.map((a) =>
    [a.nodeLabel, a.logMsg?.content, a.severityLabel, a.ackUser].filter(Boolean).join(" ").toLowerCase()
  );

  return (
    <>
      <TopBar title="Alarms" />
      <div className="flex flex-col gap-4 p-6">
        {error && (
          <div className="glass-card p-4 text-sm" style={{ color: "var(--status-warning)" }}>
            {error}
          </div>
        )}
        <FilterableTable searchIndex={searchIndex} placeholder="Filter by node, message, or severity…">
          <div className="glass-card overflow-hidden">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Node</th>
                  <th>Message</th>
                  <th>Ack</th>
                  <th>Last Event</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {alarms.length === 0 && !error && (
                  <tr>
                    <td colSpan={6} className="text-center" style={{ color: "var(--text-muted)" }}>
                      No alarms — all clear.
                    </td>
                  </tr>
                )}
                {alarms.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <StatusPill severity={a.severityLabel} />
                    </td>
                    <td style={{ color: "var(--text-primary)" }}>{a.nodeLabel ?? "—"}</td>
                    <td style={{ color: "var(--text-secondary)" }} className="max-w-lg truncate">
                      {a.logMsg?.content ?? "—"}
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>{a.ackUser ?? "Unacked"}</td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {a.lastEventTime ? new Date(a.lastEventTime).toLocaleString() : "—"}
                    </td>
                    <td>
                      <AlarmRowActions alarmId={a.id} acked={Boolean(a.ackUser)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FilterableTable>
      </div>
    </>
  );
}
