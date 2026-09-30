import { TopBar } from "@/components/TopBar";
import { FilterableTable } from "@/components/FilterableTable";
import { routingnms } from "@/lib/routingnms-client";

export const dynamic = "force-dynamic";

function statusColor(status?: string) {
  switch ((status ?? "").toUpperCase()) {
    case "STARTED":
      return "var(--status-up)";
    case "STOPPED":
    case "UNRESPONSIVE":
      return "var(--status-down)";
    default:
      return "var(--text-muted)";
  }
}

export default async function MinionsPage() {
  let minions: Awaited<ReturnType<typeof routingnms.listMinions>> = [];
  let error: string | null = null;

  try {
    minions = await routingnms.listMinions();
  } catch {
    error = "Couldn't reach the RoutingNMS API. Check ROUTINGNMS_API_URL / credentials.";
  }

  const searchIndex = minions.map((m) =>
    [m.label, m.id, m.location, m.status].filter(Boolean).join(" ").toLowerCase()
  );

  return (
    <>
      <TopBar title="Distributed Monitoring" />
      <div className="flex flex-col gap-6 p-6">
        {error && (
          <div className="glass-card p-4 text-sm" style={{ color: "var(--status-warning)" }}>
            {error}
          </div>
        )}

        <FilterableTable searchIndex={searchIndex} placeholder="Filter minions…">
          <div className="glass-card overflow-hidden">
            <div
              className="flex items-center justify-between border-b px-5 py-4"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Minions
              </h2>
              <span
                className="rounded-full px-2.5 py-1 text-xs font-medium"
                style={{ background: "var(--accent-soft)", color: "var(--text-secondary)" }}
              >
                {minions.length}
              </span>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Minion</th>
                  <th>Monitoring Location</th>
                  <th>Status</th>
                  <th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {minions.length === 0 && !error && (
                  <tr>
                    <td colSpan={4} className="text-center" style={{ color: "var(--text-muted)" }}>
                      No Minions deployed — this instance is monitoring directly.
                    </td>
                  </tr>
                )}
                {minions.map((m) => (
                  <tr key={m.id}>
                    <td style={{ color: "var(--text-primary)" }}>{m.label ?? m.id}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{m.location ?? "—"}</td>
                    <td style={{ color: statusColor(m.status) }}>{m.status ?? "Unknown"}</td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {m.lastUpdated ? new Date(m.lastUpdated).toLocaleString() : "—"}
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
