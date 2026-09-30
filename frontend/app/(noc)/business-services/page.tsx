import { TopBar } from "@/components/TopBar";
import { StatusPill } from "@/components/StatusPill";
import { FilterableTable } from "@/components/FilterableTable";
import { routingnms } from "@/lib/routingnms-client";

export const dynamic = "force-dynamic";

export default async function BusinessServicesPage() {
  let services: Awaited<ReturnType<typeof routingnms.listBusinessServices>> = [];
  let error: string | null = null;

  try {
    services = await routingnms.listBusinessServices();
  } catch {
    error = "Couldn't reach the RoutingNMS API. Check ROUTINGNMS_API_URL / credentials.";
  }

  const searchIndex = services.map((s) =>
    [s.name, s.operationalStatus].filter(Boolean).join(" ").toLowerCase()
  );

  return (
    <>
      <TopBar title="Business Service Monitoring" />
      <div className="flex flex-col gap-6 p-6">
        {error && (
          <div className="glass-card p-4 text-sm" style={{ color: "var(--status-warning)" }}>
            {error}
          </div>
        )}

        <FilterableTable searchIndex={searchIndex} placeholder="Filter business services…">
          <div className="glass-card overflow-hidden">
            <div
              className="flex items-center justify-between border-b px-5 py-4"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Business Services
              </h2>
              <span
                className="rounded-full px-2.5 py-1 text-xs font-medium"
                style={{ background: "var(--accent-soft)", color: "var(--text-secondary)" }}
              >
                {services.length}
              </span>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Service</th>
                  <th>Contributing Alarms</th>
                  <th>Child Edges</th>
                </tr>
              </thead>
              <tbody>
                {services.length === 0 && !error && (
                  <tr>
                    <td colSpan={4} className="text-center" style={{ color: "var(--text-muted)" }}>
                      No business services configured yet.
                    </td>
                  </tr>
                )}
                {services.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <StatusPill severity={s.operationalStatus ?? "INDETERMINATE"} />
                    </td>
                    <td style={{ color: "var(--text-primary)" }}>{s.name}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{s.reductionKeys ?? "—"}</td>
                    <td style={{ color: "var(--text-muted)" }}>{s.childEdges ?? "—"}</td>
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
