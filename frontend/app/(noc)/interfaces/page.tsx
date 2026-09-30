import { TopBar } from "@/components/TopBar";
import { FilterableTable } from "@/components/FilterableTable";
import { routingnms } from "@/lib/routingnms-client";

export const dynamic = "force-dynamic";

export default async function InterfacesPage() {
  let interfaces: Awaited<ReturnType<typeof routingnms.listInterfaces>> = [];
  let error: string | null = null;

  try {
    interfaces = await routingnms.listInterfaces(60);
  } catch {
    error = "Couldn't reach the RoutingNMS API. Check ROUTINGNMS_API_URL / credentials.";
  }

  const up = interfaces.filter((i) => i.snmpIfOperStatus === 1).length;
  const down = interfaces.filter((i) => i.snmpIfOperStatus === 2).length;

  return (
    <>
      <TopBar title="Interfaces" />
      <div className="flex flex-col gap-6 p-6">
        {error && (
          <div className="glass-card p-4 text-sm" style={{ color: "var(--status-warning)" }}>
            {error}
          </div>
        )}

        <FilterableTable
          rows={interfaces}
          searchFields={(i) => [i.nodeLabel, i.ipAddress, i.snmpIfDescr, i.snmpIfAlias]}
          placeholder="Filter by node, IP, or ifDescr…"
        >
          {(filtered) => (
            <div className="glass-card overflow-hidden">
              <div
                className="flex items-center justify-between border-b px-5 py-4"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  IP / SNMP Interfaces
                </h2>
                <div className="flex items-center gap-2 text-xs">
                  <span style={{ color: "var(--status-up)" }}>{up} up</span>
                  <span style={{ color: "var(--text-muted)" }}>·</span>
                  <span style={{ color: "var(--status-down)" }}>{down} down</span>
                  <span
                    className="rounded-full px-2.5 py-1 font-medium"
                    style={{ background: "var(--accent-soft)", color: "var(--text-secondary)" }}
                  >
                    {interfaces.length}
                  </span>
                </div>
              </div>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Node</th>
                    <th>IP Address</th>
                    <th>Primary</th>
                    <th>SNMP ifDescr</th>
                    <th>ifAlias</th>
                    <th>Oper Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && !error && (
                    <tr>
                      <td colSpan={6} className="text-center" style={{ color: "var(--text-muted)" }}>
                        {interfaces.length === 0
                          ? "No interfaces found (first 60 nodes checked)."
                          : "No interfaces match that filter."}
                      </td>
                    </tr>
                  )}
                  {filtered.map((i, idx) => (
                    <tr key={`${i.nodeId}-${i.ipAddress}-${idx}`}>
                      <td style={{ color: "var(--text-primary)" }}>{i.nodeLabel ?? i.nodeId}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{i.ipAddress}</td>
                      <td style={{ color: "var(--text-muted)" }}>{i.isPrimary ? "Yes" : "—"}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{i.snmpIfDescr ?? "—"}</td>
                      <td style={{ color: "var(--text-muted)" }}>{i.snmpIfAlias ?? "—"}</td>
                      <td
                        style={{
                          color:
                            i.snmpIfOperStatus === 1
                              ? "var(--status-up)"
                              : i.snmpIfOperStatus === 2
                                ? "var(--status-down)"
                                : "var(--text-muted)",
                        }}
                      >
                        {i.snmpIfOperStatus === 1 ? "Up" : i.snmpIfOperStatus === 2 ? "Down" : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </FilterableTable>
      </div>
    </>
  );
}
