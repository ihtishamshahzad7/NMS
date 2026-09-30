import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { routingnms } from "@/lib/routingnms-client";

export const dynamic = "force-dynamic";

export default async function ResourcesIndexPage() {
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
      <TopBar title="Resource Graphs" />
      <div className="flex flex-col gap-4 p-6">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Pick a node to view its performance data — interface throughput, response time,
          and anything else this instance is already collecting.
        </p>
        {error && (
          <div className="glass-card p-4 text-sm" style={{ color: "var(--status-warning)" }}>
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {nodes.map((n) => (
            <Link
              key={n.id}
              href={`/resources/${n.id}`}
              className="glass-card p-4 transition-colors"
            >
              <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {n.label}
              </div>
              <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {n.sysLocation ?? "No location set"}
              </div>
            </Link>
          ))}
          {nodes.length === 0 && !error && (
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>
              No nodes to show graphs for yet.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
