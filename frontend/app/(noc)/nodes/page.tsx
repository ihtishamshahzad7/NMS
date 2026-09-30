import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { FilterableTable } from "@/components/FilterableTable";
import { routingnms } from "@/lib/routingnms-client";

export const dynamic = "force-dynamic";

export default async function NodesPage() {
  let nodes: Awaited<ReturnType<typeof routingnms.listNodes>>["nodes"] = [];
  let error: string | null = null;

  try {
    const res = await routingnms.listNodes(200);
    nodes = res.nodes;
  } catch {
    error = "Couldn't reach the RoutingNMS API. Check ROUTINGNMS_API_URL / credentials.";
  }

  return (
    <>
      <TopBar title="Nodes" />
      <div className="flex flex-col gap-4 p-6">
        {error && (
          <div className="glass-card p-4 text-sm" style={{ color: "var(--status-warning)" }}>
            {error}
          </div>
        )}
        <FilterableTable
          rows={nodes}
          searchFields={(n) => [n.label, n.foreignSource, n.sysLocation]}
          placeholder="Filter by label, foreign source, or location…"
        >
          {(filtered) => (
            <div className="glass-card overflow-hidden">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Foreign Source</th>
                    <th>Location</th>
                    <th>Provisioned</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && !error && (
                    <tr>
                      <td colSpan={4} className="text-center" style={{ color: "var(--text-muted)" }}>
                        {nodes.length === 0 ? "No nodes found." : "No nodes match that filter."}
                      </td>
                    </tr>
                  )}
                  {filtered.map((n) => (
                    <tr key={n.id}>
                      <td>
                        <Link
                          href={`/nodes/${n.id}`}
                          style={{ color: "var(--text-primary)" }}
                          className="hover:underline"
                        >
                          {n.label}
                        </Link>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{n.foreignSource ?? "—"}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{n.sysLocation ?? "—"}</td>
                      <td style={{ color: "var(--text-muted)" }}>
                        {n.createTime ? new Date(n.createTime).toLocaleDateString() : "—"}
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
