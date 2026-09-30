import { TopBar } from "@/components/TopBar";
import { routingnms } from "@/lib/routingnms-client";

export const dynamic = "force-dynamic";

export default async function OutagesPage() {
  let outages: Awaited<ReturnType<typeof routingnms.listOutages>>["outages"] = [];
  let error: string | null = null;

  try {
    const res = await routingnms.listOutages(200);
    outages = res.outages;
  } catch {
    error = "Couldn't reach the RoutingNMS API. Check ROUTINGNMS_API_URL / credentials.";
  }

  const active = outages.filter((o) => !o.ifRegainedService);
  const resolved = outages.filter((o) => o.ifRegainedService);

  return (
    <>
      <TopBar title="Outages" />
      <div className="flex flex-col gap-6 p-6">
        {error && (
          <div className="glass-card p-4 text-sm" style={{ color: "var(--status-warning)" }}>
            {error}
          </div>
        )}

        <div className="glass-card overflow-hidden">
          <div
            className="flex items-center justify-between border-b px-5 py-4"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Active outages
            </h2>
            <span
              className="rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                background: active.length > 0 ? "rgba(239,68,68,0.12)" : "var(--accent-soft)",
                color: active.length > 0 ? "var(--status-down)" : "var(--text-secondary)",
              }}
            >
              {active.length}
            </span>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Node</th>
                <th>IP Address</th>
                <th>Service</th>
                <th>Lost Service</th>
              </tr>
            </thead>
            <tbody>
              {active.length === 0 && !error && (
                <tr>
                  <td colSpan={4} className="text-center" style={{ color: "var(--text-muted)" }}>
                    No active outages — all services up.
                  </td>
                </tr>
              )}
              {active.map((o) => (
                <tr key={o.id}>
                  <td style={{ color: "var(--text-primary)" }}>{o.nodeLabel ?? "—"}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{o.ipAddress ?? "—"}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{o.serviceName ?? "—"}</td>
                  <td style={{ color: "var(--status-down)" }}>
                    {o.ifLostService ? new Date(o.ifLostService).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass-card overflow-hidden">
          <div
            className="flex items-center justify-between border-b px-5 py-4"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Recently resolved
            </h2>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Node</th>
                <th>Service</th>
                <th>Lost Service</th>
                <th>Regained Service</th>
              </tr>
            </thead>
            <tbody>
              {resolved.length === 0 && !error && (
                <tr>
                  <td colSpan={4} className="text-center" style={{ color: "var(--text-muted)" }}>
                    Nothing resolved recently.
                  </td>
                </tr>
              )}
              {resolved.slice(0, 50).map((o) => (
                <tr key={o.id}>
                  <td style={{ color: "var(--text-primary)" }}>{o.nodeLabel ?? "—"}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{o.serviceName ?? "—"}</td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {o.ifLostService ? new Date(o.ifLostService).toLocaleString() : "—"}
                  </td>
                  <td style={{ color: "var(--status-up)" }}>
                    {o.ifRegainedService ? new Date(o.ifRegainedService).toLocaleString() : "—"}
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
