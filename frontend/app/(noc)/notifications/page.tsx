import { TopBar } from "@/components/TopBar";
import { routingnms } from "@/lib/routingnms-client";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  let notifications: Awaited<ReturnType<typeof routingnms.listNotifications>>["notifications"] = [];
  let error: string | null = null;

  try {
    const res = await routingnms.listNotifications(200);
    notifications = res.notifications;
  } catch {
    error = "Couldn't reach the RoutingNMS API. Check ROUTINGNMS_API_URL / credentials.";
  }

  const outstanding = notifications.filter((n) => !n.respondTime);
  const acknowledged = notifications.filter((n) => n.respondTime);

  return (
    <>
      <TopBar title="Notifications" />
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
              Outstanding
            </h2>
            <span
              className="rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                background: outstanding.length > 0 ? "rgba(239,68,68,0.12)" : "var(--accent-soft)",
                color: outstanding.length > 0 ? "var(--status-down)" : "var(--text-secondary)",
              }}
            >
              {outstanding.length}
            </span>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Node</th>
                <th>Subject</th>
                <th>Message</th>
                <th>Sent</th>
              </tr>
            </thead>
            <tbody>
              {outstanding.length === 0 && !error && (
                <tr>
                  <td colSpan={4} className="text-center" style={{ color: "var(--text-muted)" }}>
                    Nothing outstanding — no unacknowledged notifications.
                  </td>
                </tr>
              )}
              {outstanding.map((n) => (
                <tr key={n.id}>
                  <td style={{ color: "var(--text-primary)" }}>{n.nodeLabel ?? "—"}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{n.subject ?? "—"}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{n.textMsg ?? "—"}</td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {n.pageTime ? new Date(n.pageTime).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass-card overflow-hidden">
          <div
            className="flex items-center justify-between border-b px-5 py-4"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Acknowledged
            </h2>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Node</th>
                <th>Subject</th>
                <th>Sent</th>
                <th>Acknowledged by</th>
              </tr>
            </thead>
            <tbody>
              {acknowledged.length === 0 && !error && (
                <tr>
                  <td colSpan={4} className="text-center" style={{ color: "var(--text-muted)" }}>
                    Nothing acknowledged recently.
                  </td>
                </tr>
              )}
              {acknowledged.slice(0, 50).map((n) => (
                <tr key={n.id}>
                  <td style={{ color: "var(--text-primary)" }}>{n.nodeLabel ?? "—"}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{n.subject ?? "—"}</td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {n.pageTime ? new Date(n.pageTime).toLocaleString() : "—"}
                  </td>
                  <td style={{ color: "var(--status-up)" }}>{n.respondUser ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
