import { TopBar } from "@/components/TopBar";
import { TopologyCanvas } from "@/components/TopologyCanvas";
import { routingnms } from "@/lib/routingnms-client";

export const dynamic = "force-dynamic";

export default async function TopologyPage() {
  let nodesRaw: Awaited<ReturnType<typeof routingnms.listNodes>>["nodes"] = [];
  let links: Awaited<ReturnType<typeof routingnms.listLinks>> = [];
  let outages: Awaited<ReturnType<typeof routingnms.listOutages>>["outages"] = [];
  let error: string | null = null;

  try {
    const [nodesRes, linksRes, outagesRes] = await Promise.all([
      routingnms.listNodes(300),
      routingnms.listLinks(),
      routingnms.listOutages(200),
    ]);
    nodesRaw = nodesRes.nodes;
    links = linksRes;
    outages = outagesRes.outages;
  } catch {
    error = "Couldn't reach the RoutingNMS API. Check ROUTINGNMS_API_URL / credentials.";
  }

  // A node is "down" on the map if it has a currently-active (unresolved)
  // outage — reusing data the Outages screen already surfaces, rather than
  // inventing a second notion of node health.
  const downLabels = new Set(
    outages.filter((o) => !o.ifRegainedService).map((o) => o.nodeLabel)
  );
  const nodes = nodesRaw.map((n) => ({
    id: n.id,
    label: n.label,
    down: downLabels.has(n.label),
  }));

  const downCount = nodes.filter((n) => n.down).length;

  return (
    <>
      <TopBar title="Topology" />
      <div className="flex flex-col gap-4 p-6">
        {error && (
          <div className="glass-card p-4 text-sm" style={{ color: "var(--status-warning)" }}>
            {error}
          </div>
        )}

        {!error && (
          <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--status-up)" }} />
              Up
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--status-down)" }} />
              Down ({downCount})
            </span>
            <span>{nodes.length} nodes · {links.length} discovered links</span>
            <span>Drag nodes to rearrange · scroll to zoom</span>
          </div>
        )}

        <div className="glass-card p-2">
          {nodes.length === 0 && !error ? (
            <div className="flex h-72 items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
              No nodes to map yet.
            </div>
          ) : (
            <TopologyCanvas nodes={nodes} links={links} />
          )}
        </div>

        {nodes.length > 0 && links.length === 0 && !error && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            No links have been discovered between these nodes yet — nodes are shown
            unconnected. Link discovery (CDP/LLDP/OSPF) runs on RoutingNMS&apos;s own
            schedule; this view will connect them automatically once it has data.
          </p>
        )}
      </div>
    </>
  );
}
