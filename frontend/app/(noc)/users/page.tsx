import { TopBar } from "@/components/TopBar";
import { FilterableTable } from "@/components/FilterableTable";
import { routingnms } from "@/lib/routingnms-client";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  let users: Awaited<ReturnType<typeof routingnms.listUsers>> = [];
  let groups: Awaited<ReturnType<typeof routingnms.listGroups>> = [];
  let error: string | null = null;

  try {
    [users, groups] = await Promise.all([routingnms.listUsers(), routingnms.listGroups()]);
  } catch {
    error = "Couldn't reach the RoutingNMS API. Check ROUTINGNMS_API_URL / credentials.";
  }

  return (
    <>
      <TopBar title="Users & Groups" />
      <div className="flex flex-col gap-6 p-6">
        {error && (
          <div className="glass-card p-4 text-sm" style={{ color: "var(--status-warning)" }}>
            {error}
          </div>
        )}

        <FilterableTable
          rows={users}
          searchFields={(u) => [u.userId, u.fullName, u.email]}
          placeholder="Filter users…"
        >
          {(filtered) => (
            <div className="glass-card overflow-hidden">
              <div
                className="flex items-center justify-between border-b px-5 py-4"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Users
                </h2>
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ background: "var(--accent-soft)", color: "var(--text-secondary)" }}
                >
                  {users.length}
                </span>
              </div>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && !error && (
                    <tr>
                      <td colSpan={4} className="text-center" style={{ color: "var(--text-muted)" }}>
                        {users.length === 0 ? "No users found." : "No users match that filter."}
                      </td>
                    </tr>
                  )}
                  {filtered.map((u) => (
                    <tr key={u.userId}>
                      <td style={{ color: "var(--text-primary)" }}>{u.userId}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{u.fullName ?? "—"}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{u.email ?? "—"}</td>
                      <td style={{ color: "var(--text-muted)" }}>{u.comments ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </FilterableTable>

        <FilterableTable
          rows={groups}
          searchFields={(g) => [g.name, g.comments]}
          placeholder="Filter groups…"
        >
          {(filtered) => (
            <div className="glass-card overflow-hidden">
              <div
                className="flex items-center justify-between border-b px-5 py-4"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Groups
                </h2>
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ background: "var(--accent-soft)", color: "var(--text-secondary)" }}
                >
                  {groups.length}
                </span>
              </div>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Members</th>
                    <th>Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && !error && (
                    <tr>
                      <td colSpan={3} className="text-center" style={{ color: "var(--text-muted)" }}>
                        {groups.length === 0 ? "No groups found." : "No groups match that filter."}
                      </td>
                    </tr>
                  )}
                  {filtered.map((g) => (
                    <tr key={g.name}>
                      <td style={{ color: "var(--text-primary)" }}>{g.name}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{g.userCount}</td>
                      <td style={{ color: "var(--text-muted)" }}>{g.comments ?? "—"}</td>
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
