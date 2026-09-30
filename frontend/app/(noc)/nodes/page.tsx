import Link from "next/link";
import { TopBar } from "@/components/TopBar";
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
              {nodes.length === 0 && !error && (
                <tr>
                  <td colSpan={4} className="text-center" style={{ color: "var(--text-muted)" }}>
                    No nodes found.
                  </td>
                </tr>
              )}
              {nodes.map((n) => (
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
      </div>
    </>
  );
}
