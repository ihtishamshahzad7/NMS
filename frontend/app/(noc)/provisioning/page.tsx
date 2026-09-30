import { TopBar } from "@/components/TopBar";
import { ImportButton } from "@/components/ImportButton";
import { AddDeviceForm } from "@/components/AddDeviceForm";
import { routingnms } from "@/lib/routingnms-client";

export const dynamic = "force-dynamic";

export default async function ProvisioningPage() {
  let requisitions: Awaited<ReturnType<typeof routingnms.listRequisitions>> = [];
  let error: string | null = null;

  try {
    requisitions = await routingnms.listRequisitions();
  } catch {
    error = "Couldn't reach the RoutingNMS API. Check ROUTINGNMS_API_URL / credentials.";
  }

  return (
    <>
      <TopBar title="Provisioning" />
      <div className="flex flex-col gap-4 p-6">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Requisitions are device groups waiting to become real monitored nodes.
          Editing a requisition happens through the existing provisioning
          workflow — this view is for reviewing what&apos;s pending and
          triggering the import that promotes them into live inventory.
        </p>

        {error && (
          <div className="glass-card p-4 text-sm" style={{ color: "var(--status-warning)" }}>
            {error}
          </div>
        )}

        <AddDeviceForm defaultForeignSource={requisitions[0]?.foreignSource ?? "routingnms"} />

        <div className="glass-card overflow-hidden">
          <table className="tbl">
            <thead>
              <tr>
                <th>Foreign Source</th>
                <th>Pending Nodes</th>
                <th>Last Import</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requisitions.length === 0 && !error && (
                <tr>
                  <td colSpan={4} className="text-center" style={{ color: "var(--text-muted)" }}>
                    No requisitions found — nothing is queued for provisioning right now.
                  </td>
                </tr>
              )}
              {requisitions.map((r) => (
                <tr key={r.foreignSource}>
                  <td style={{ color: "var(--text-primary)" }}>{r.foreignSource}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{r.nodeCount}</td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {r.lastImport ? new Date(r.lastImport).toLocaleString() : "Never imported"}
                  </td>
                  <td>
                    <ImportButton foreignSource={r.foreignSource} />
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
