import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { routingnms } from "@/lib/routingnms-client";

export const dynamic = "force-dynamic";

export default async function NodeDetailPage({
  params,
}: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId: nodeIdParam } = await params;
  const nodeId = Number(nodeIdParam);

  const [node, interfaces, asset] = await Promise.all([
    routingnms.getNode(nodeId),
    routingnms.nodeInterfaces(nodeId),
    routingnms.nodeAsset(nodeId),
  ]);

  return (
    <>
      <TopBar title={node?.label ?? `Node ${nodeId}`} />
      <div className="flex flex-col gap-6 p-6">
        {!node && (
          <div className="glass-card p-4 text-sm" style={{ color: "var(--status-warning)" }}>
            Couldn&apos;t load this node — it may not exist, or the API is unreachable.
          </div>
        )}

        <div className="glass-card overflow-hidden">
          <div
            className="flex items-center justify-between border-b px-5 py-4"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Overview
            </h2>
            <Link
              href={`/resources/${nodeId}`}
              className="text-xs font-medium"
              style={{ color: "var(--accent)" }}
            >
              View resource graphs →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 p-5 text-sm sm:grid-cols-4">
            <div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Foreign Source
              </div>
              <div style={{ color: "var(--text-primary)" }}>{node?.foreignSource ?? "—"}</div>
            </div>
            <div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Location
              </div>
              <div style={{ color: "var(--text-primary)" }}>{node?.sysLocation ?? "—"}</div>
            </div>
            <div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Provisioned
              </div>
              <div style={{ color: "var(--text-primary)" }}>
                {node?.createTime ? new Date(node.createTime).toLocaleDateString() : "—"}
              </div>
            </div>
            <div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Node ID
              </div>
              <div style={{ color: "var(--text-primary)" }}>{nodeId}</div>
            </div>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div
            className="border-b px-5 py-4"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              IP / SNMP Interfaces
            </h2>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>IP Address</th>
                <th>Primary</th>
                <th>ifDescr</th>
                <th>ifAlias</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {interfaces.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center" style={{ color: "var(--text-muted)" }}>
                    No interfaces found for this node.
                  </td>
                </tr>
              )}
              {interfaces.map((i, idx) => (
                <tr key={`${i.ipAddress}-${idx}`}>
                  <td style={{ color: "var(--text-primary)" }}>{i.ipAddress}</td>
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

        <div className="glass-card overflow-hidden">
          <div
            className="border-b px-5 py-4"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Asset Record
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 p-5 text-sm sm:grid-cols-4">
            <div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Manufacturer
              </div>
              <div style={{ color: "var(--text-primary)" }}>{asset?.manufacturer ?? "—"}</div>
            </div>
            <div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Model
              </div>
              <div style={{ color: "var(--text-primary)" }}>{asset?.modelNumber ?? "—"}</div>
            </div>
            <div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Serial #
              </div>
              <div style={{ color: "var(--text-primary)" }}>{asset?.serialNumber ?? "—"}</div>
            </div>
            <div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Location
              </div>
              <div style={{ color: "var(--text-primary)" }}>
                {[asset?.region, asset?.building, asset?.room, asset?.rack]
                  .filter(Boolean)
                  .join(" / ") || "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
