import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { ResourceChart } from "@/components/ResourceChart";
import { routingnms, type OnmsResource, type MeasurementSource } from "@/lib/routingnms-client";

export const dynamic = "force-dynamic";

const RANGES: Record<string, number> = {
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

// Flatten the resource tree into a simple pickable list (graphable
// resources only — anything that actually has rrdGraphAttributes).
function flattenGraphable(resources: OnmsResource[]): OnmsResource[] {
  const out: OnmsResource[] = [];
  for (const r of resources) {
    if (r.rrdGraphAttributes && Object.keys(r.rrdGraphAttributes).length > 0) out.push(r);
    if (r.children?.resource) out.push(...flattenGraphable(r.children.resource));
  }
  return out;
}

export default async function NodeResourcesPage({
  params,
  searchParams,
}: {
  params: Promise<{ nodeId: string }>;
  searchParams: Promise<{ resource?: string; range?: string }>;
}) {
  const { nodeId } = await params;
  const sp = await searchParams;
  const range = sp.range && RANGES[sp.range] ? sp.range : "24h";

  let graphable: OnmsResource[] = [];
  let error: string | null = null;

  try {
    const tree = await routingnms.nodeResources(Number(nodeId));
    graphable = flattenGraphable(tree);
  } catch {
    error = "Couldn't reach the RoutingNMS API. Check ROUTINGNMS_API_URL / credentials.";
  }

  const selected = graphable.find((r) => r.id === sp.resource) ?? graphable[0];

  let labels: string[] = [];
  let points: Awaited<ReturnType<typeof routingnms.queryMeasurements>>["points"] = [];
  let queryError: string | null = null;

  if (selected?.rrdGraphAttributes) {
    // Chart up to the first 4 numeric attributes on the selected resource
    // — enough to show real, multi-series data without an overcrowded
    // legend on something like an interface's in/out octet counters.
    const attrNames = Object.keys(selected.rrdGraphAttributes).slice(0, 4);
    const sources: MeasurementSource[] = attrNames.map((attr) => ({
      resourceId: selected.id,
      attribute: attr,
      aggregation: "AVERAGE",
      label: attr,
    }));

    try {
      const now = Date.now();
      const res = await routingnms.queryMeasurements({
        start: now - RANGES[range],
        end: now,
        sources,
      });
      labels = res.labels;
      points = res.points;
    } catch {
      queryError = "That resource has no measurement data for this window yet.";
    }
  }

  return (
    <>
      <TopBar title="Resource Graphs" />
      <div className="flex flex-col gap-4 p-6">
        <Link href="/resources" className="text-xs" style={{ color: "var(--text-muted)" }}>
          ← Back to nodes
        </Link>

        {error && (
          <div className="glass-card p-4 text-sm" style={{ color: "var(--status-warning)" }}>
            {error}
          </div>
        )}

        {!error && graphable.length === 0 && (
          <div className="glass-card p-4 text-sm" style={{ color: "var(--text-muted)" }}>
            No graphable resources found for this node yet (nothing has been collected).
          </div>
        )}

        {graphable.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {graphable.map((r) => (
              <Link
                key={r.id}
                href={`/resources/${nodeId}?resource=${encodeURIComponent(r.id)}&range=${range}`}
                className="rounded-md border px-3 py-1.5 text-xs"
                style={{
                  borderColor:
                    r.id === selected?.id ? "var(--accent)" : "var(--border-subtle)",
                  color: r.id === selected?.id ? "var(--accent)" : "var(--text-secondary)",
                  background: r.id === selected?.id ? "var(--accent-soft)" : "transparent",
                }}
              >
                {r.label}
              </Link>
            ))}
          </div>
        )}

        {selected && (
          <div className="glass-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {selected.label}
              </h2>
              <div className="flex gap-1 rounded-md border p-0.5" style={{ borderColor: "var(--border-subtle)" }}>
                {Object.keys(RANGES).map((r) => (
                  <Link
                    key={r}
                    href={`/resources/${nodeId}?resource=${encodeURIComponent(selected.id)}&range=${r}`}
                    className="rounded px-2.5 py-1 text-xs"
                    style={{
                      background: r === range ? "var(--accent-soft)" : "transparent",
                      color: r === range ? "var(--accent)" : "var(--text-secondary)",
                    }}
                  >
                    {r}
                  </Link>
                ))}
              </div>
            </div>

            {queryError ? (
              <div className="py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                {queryError}
              </div>
            ) : (
              <ResourceChart labels={labels} points={points} />
            )}
          </div>
        )}
      </div>
    </>
  );
}
