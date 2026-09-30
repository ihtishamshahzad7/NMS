import { TopBar } from "@/components/TopBar";
import { FilterableTable } from "@/components/FilterableTable";
import { routingnms } from "@/lib/routingnms-client";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  let reports: Awaited<ReturnType<typeof routingnms.listReportDefinitions>> = [];
  let error: string | null = null;

  try {
    reports = await routingnms.listReportDefinitions();
  } catch {
    error = "Couldn't reach the RoutingNMS API. Check ROUTINGNMS_API_URL / credentials.";
  }

  const searchIndex = reports.map((r) =>
    [r.displayName, r.id, r.description].filter(Boolean).join(" ").toLowerCase()
  );

  return (
    <>
      <TopBar title="Reports" />
      <div className="flex flex-col gap-6 p-6">
        {error && (
          <div className="glass-card p-4 text-sm" style={{ color: "var(--status-warning)" }}>
            {error}
          </div>
        )}

        <FilterableTable searchIndex={searchIndex} placeholder="Filter reports…">
          <div className="glass-card overflow-hidden">
            <div
              className="flex items-center justify-between border-b px-5 py-4"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Report Catalog
              </h2>
              <span
                className="rounded-full px-2.5 py-1 text-xs font-medium"
                style={{ background: "var(--accent-soft)", color: "var(--text-secondary)" }}
              >
                {reports.length}
              </span>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Description</th>
                  <th>Availability</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 && !error && (
                  <tr>
                    <td colSpan={3} className="text-center" style={{ color: "var(--text-muted)" }}>
                      No report definitions found.
                    </td>
                  </tr>
                )}
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td style={{ color: "var(--text-primary)" }}>{r.displayName ?? r.id}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{r.description ?? "—"}</td>
                    <td
                      style={{
                        color: r.online === false ? "var(--text-muted)" : "var(--status-up)",
                      }}
                    >
                      {r.online === false ? "Offline" : "Online"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FilterableTable>

        <div className="glass-card p-4 text-xs" style={{ color: "var(--text-muted)" }}>
          Running and downloading a rendered report isn&apos;t wired up yet — this is the
          catalog view only. Ask to add on-demand report generation once this list is
          confirmed against your instance.
        </div>
      </div>
    </>
  );
}
