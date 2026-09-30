import { TopBar } from "@/components/TopBar";
import { routingnms } from "@/lib/routingnms-client";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  let assets: Awaited<ReturnType<typeof routingnms.listAssets>> = [];
  let error: string | null = null;

  try {
    assets = await routingnms.listAssets(200);
  } catch {
    error = "Couldn't reach the RoutingNMS API. Check ROUTINGNMS_API_URL / credentials.";
  }

  return (
    <>
      <TopBar title="Asset Management" />
      <div className="flex flex-col gap-6 p-6">
        {error && (
          <div className="glass-card p-4 text-sm" style={{ color: "var(--status-warning)" }}>
            {error}
          </div>
        )}

        <div className="glass-card overflow-hidden">
          <div
            className="flex items-center justify-between border-b px-5 py-4"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Node Assets
            </h2>
            <span
              className="rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ background: "var(--accent-soft)", color: "var(--text-secondary)" }}
            >
              {assets.length}
            </span>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Node</th>
                <th>Manufacturer</th>
                <th>Model</th>
                <th>Serial #</th>
                <th>Asset #</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 && !error && (
                <tr>
                  <td colSpan={6} className="text-center" style={{ color: "var(--text-muted)" }}>
                    No asset records populated yet — fill them in from the node detail page.
                  </td>
                </tr>
              )}
              {assets.map((a) => (
                <tr key={a.nodeId}>
                  <td style={{ color: "var(--text-primary)" }}>{a.nodeLabel ?? a.nodeId}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{a.manufacturer ?? "—"}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{a.modelNumber ?? "—"}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{a.serialNumber ?? "—"}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{a.assetNumber ?? "—"}</td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {[a.region, a.building, a.room, a.rack].filter(Boolean).join(" / ") || "—"}
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
