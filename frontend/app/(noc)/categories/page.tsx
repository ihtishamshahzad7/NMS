import { TopBar } from "@/components/TopBar";
import { FilterableTable } from "@/components/FilterableTable";
import { routingnms } from "@/lib/routingnms-client";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  let categories: Awaited<ReturnType<typeof routingnms.listCategories>> = [];
  let error: string | null = null;

  try {
    categories = await routingnms.listCategories();
  } catch {
    error = "Couldn't reach the RoutingNMS API. Check ROUTINGNMS_API_URL / credentials.";
  }

  return (
    <>
      <TopBar title="Surveillance Categories" />
      <div className="flex flex-col gap-6 p-6">
        {error && (
          <div className="glass-card p-4 text-sm" style={{ color: "var(--status-warning)" }}>
            {error}
          </div>
        )}

        <FilterableTable
          rows={categories}
          searchFields={(c) => [c.name, c.description]}
          placeholder="Filter categories…"
        >
          {(filtered) => (
            <div className="glass-card overflow-hidden">
              <div
                className="flex items-center justify-between border-b px-5 py-4"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Categories
                </h2>
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ background: "var(--accent-soft)", color: "var(--text-secondary)" }}
                >
                  {categories.length}
                </span>
              </div>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Nodes</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && !error && (
                    <tr>
                      <td colSpan={3} className="text-center" style={{ color: "var(--text-muted)" }}>
                        {categories.length === 0
                          ? "No categories defined yet."
                          : "No categories match that filter."}
                      </td>
                    </tr>
                  )}
                  {filtered.map((c) => (
                    <tr key={c.name}>
                      <td style={{ color: "var(--text-primary)" }}>{c.name}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{c.description ?? "—"}</td>
                      <td style={{ color: "var(--text-muted)" }}>{c.nodeCount}</td>
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
