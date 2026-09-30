# RoutingNMS UI

A new, modern React/Next.js frontend for the OpenNMS backend in `../R-NMS`.
**The OpenNMS Java monitoring engine is completely untouched** — this app
only talks to its existing REST v2 API. Nothing was deleted or modified in
the backend.

## Why this exists
The old OpenNMS web UI (Vaadin/JSP) works but looks dated. This project
replaces the UI only, screen by screen, without touching a single line of
the monitoring/polling/alerting engine underneath.

## Rebranding
Everything brand-related lives in two files:
- `lib/brand.ts` — product name, tagline, logo letter, sidebar nav
- `app/globals.css` (top `:root` block) — colors, accent gradient, radii

Change those two files and the whole app re-skins. No component hardcodes
"RoutingNMS" or a color.

## Running it
1. `npm install`
2. Copy `.env.example` to `.env.local` and point it at your real OpenNMS
   instance (base URL + a user with API access — the same credentials
   the classic web UI uses).
3. `npm run dev` — opens on http://localhost:3000, redirects to
   `/dashboard`.

If OpenNMS isn't reachable yet, every screen still renders (empty state +
a warning banner) instead of crashing — safe to preview before a backend
is wired up.

## What's built so far (Phase 1)
- `/dashboard` — node/alarm/outage counts + recent alarms feed
- `/nodes` — full node inventory table
- `/alarms` — full alarm list with severity, ack status, timestamps

## What's next (in priority order, per the phased plan)
- `/events`, `/outages` — same data-table pattern as Nodes/Alarms
- `/resources` — performance graphs (RRD/Newts-backed resource data)
- `/topology` — network topology map
- `/provisioning` — discovery/import UI

Each new screen follows the same recipe: add a nav entry in
`lib/brand.ts`, add API calls to `lib/opennms-client.ts` if needed, build
the page under `app/(noc)/<name>/page.tsx` reusing `glass-card`/`tbl`/
`StatusPill` so every screen stays visually consistent automatically.

## Design system (the "dynamically styled modern" look)
- Dark NOC palette with a soft radial brand-accent glow behind every page
  (`.app-shell` in globals.css)
- `glass-card` — the one card style used everywhere (dashboard tiles,
  tables, panels) so nothing looks bolted-on
- `StatusPill` — one shared severity→color mapping, used by every table
  so a color always means the same thing across the whole app
- Everything reads CSS variables, so a future theme (light mode, a
  different accent) is a token change, not a rewrite
