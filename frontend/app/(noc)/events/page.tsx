import { TopBar } from "@/components/TopBar";
import { FilterableTable } from "@/components/FilterableTable";
import { routingnms } from "@/lib/routingnms-client";

export const dynamic = "force-dynamic";

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "var(--status-down)",
  MAJOR: "var(--status-down)",
  MINOR: "var(--status-warning)",
  WARNING: "var(--status-warning)",
  NORMAL: "var(--status-up)",
  CLEARED: "var(--status-up)",
  INDETERMINATE: "var(--status-unknown)",
};

export default async function EventsPage() {
  let events: Awaited<ReturnType<typeof routingnms.listEvents>>["events"] = [];
  let error: string | null = null;

  try {
    const res = await routingnms.listEvents(200);
    events = res.events;
  } catch {
    error = "Couldn't reach the RoutingNMS API. Check ROUTINGNMS_API_URL / credentials.";
  }

  const searchIndex = events.map((e) =>
    [e.nodeLabel, e.uei, e.logMessage, e.severity].filter(Boolean).join(" ").toLowerCase()
  );

  return (
    <>
      <TopBar title="Events" />
      <div className="flex flex-col gap-4 p-6">
        {error && (
          <div className="glass-card p-4 text-sm" style={{ color: "var(--status-warning)" }}>
            {error}
          </div>
        )}
        <FilterableTable searchIndex={searchIndex} placeholder="Filter by node, UEI, or message…">
          <div className="glass-card overflow-hidden">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Node</th>
                  <th>UEI</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 && !error && (
                  <tr>
                    <td colSpan={4} className="text-center" style={{ color: "var(--text-muted)" }}>
                      No events yet.
                    </td>
                  </tr>
                )}
                {events.map((e) => {
                  const color =
                    SEVERITY_COLOR[(e.severity ?? "").toUpperCase()] ?? "var(--status-unknown)";
                  return (
                    <tr key={e.id}>
                      <td style={{ color: "var(--text-muted)" }}>
                        {e.time ? new Date(e.time).toLocaleString() : "—"}
                      </td>
                      <td style={{ color: "var(--text-primary)" }}>{e.nodeLabel ?? "—"}</td>
                      <td>
                        <span
                          className="rounded px-1.5 py-0.5 text-[11px] font-mono"
                          style={{ background: `${color}1f`, color }}
                        >
                          {e.uei?.split("/").pop() ?? e.uei ?? "—"}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }} className="max-w-lg truncate">
                        {e.logMessage ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </FilterableTable>
      </div>
    </>
  );
}
