/**
 * Single place to rebrand the whole app: name, tagline, logo, nav order.
 * Nothing else in the codebase should hardcode the product name — every
 * screen imports BRAND from here. Swap this file (and the CSS tokens in
 * app/globals.css) to fully re-skin without touching feature code.
 */
export const BRAND = {
  name: "RoutingNMS",
  shortName: "RNMS",
  tagline: "Monitor • Manage • Keep Connected",
  logoText: "R",
} as const;

export type NavGroup = {
  label: string;
  items: { label: string; href: string; icon: string }[];
};

/**
 * Sidebar structure. Each entry maps to a screen we're rebuilding.
 * Grouped to mirror RoutingNMS's own domains so nothing users rely on today
 * goes missing — we are only re-skinning, not removing capability.
 * Add a group/item here as each backend area gets its new UI; the old
 * RoutingNMS web UI stays the fallback for anything not yet listed.
 */
export const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" }],
  },
  {
    label: "Monitoring",
    items: [
      { label: "Nodes", href: "/nodes", icon: "Server" },
      { label: "Alarms", href: "/alarms", icon: "AlertTriangle" },
      { label: "Events", href: "/events", icon: "Activity" },
      { label: "Outages", href: "/outages", icon: "PlugZap" },
    ],
  },
  {
    label: "Performance",
    items: [{ label: "Resource Graphs", href: "/resources", icon: "LineChart" }],
  },
  {
    label: "Network",
    items: [
      { label: "Topology", href: "/topology", icon: "Share2" },
      { label: "Provisioning", href: "/provisioning", icon: "PlusSquare" },
    ],
  },
];
