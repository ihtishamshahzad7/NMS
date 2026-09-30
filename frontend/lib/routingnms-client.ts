/**
 * Thin client for RoutingNMS's own REST API (v2, JSON) — the same API its
 * stock Vaadin/JSP web UI already runs on. We never touch the Java
 * backend; this file is the ONLY place that knows the wire format, so a
 * future backend-side change (or moving from Basic Auth to something
 * else) is a one-file fix.
 *
 * Auth: RoutingNMS's REST API accepts HTTP Basic Auth by default
 * (the same admin/user credentials as the classic web UI). Configure
 * the base URL + credentials via env vars — see .env.example.
 */

import { XMLParser } from "fast-xml-parser";

const BASE_URL = process.env.ROUTINGNMS_API_URL ?? "http://localhost:8980/routingnms";
const API_V2 = `${BASE_URL}/api/v2`;
// The resource tree and the measurements query engine were never migrated
// to v2 in upstream RoutingNMS — they're still served from the older v1 REST
// API. Both live clients hit the same server, just a different path root.
//
// IMPORTANT: against the real deployed instance, v1 (`/rest/...`) replies
// with XML by default — sending `Accept: application/json` does NOT change
// this on this OpenNMS version. v2 (`/api/v2/...`) does honor it and really
// returns JSON. So requestV1 below parses XML; request (v2) parses JSON.
const API_V1 = `${BASE_URL}/rest`;

function authHeader(): Record<string, string> {
  const user = process.env.ROUTINGNMS_API_USER;
  const pass = process.env.ROUTINGNMS_API_PASSWORD;
  if (!user || !pass) return {};
  const token = Buffer.from(`${user}:${pass}`).toString("base64");
  return { Authorization: `Basic ${token}` };
}

// Tag names that must always come back as arrays even when the server
// collapses a single-child collection to one bare element (standard XML
// parser ambiguity — "one node" and "the node tag" look identical on the
// wire). Every plural resource this client reads falls in here.
const ALWAYS_ARRAY = new Set([
  "node",
  "alarm",
  "event",
  "outage",
  "link",
  "category",
  "user",
  "group",
  "minion",
  "businessService",
  "business-service",
  "report",
  "notification",
  "ipInterface",
  "model-import",
  "interface",
  "resource",
]);

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  parseAttributeValue: false,
  parseTagValue: false,
  textNodeName: "#text",
  // Must check isAttribute — several of these names (category, node, user)
  // are also used as plain XML *attribute* names elsewhere (e.g. an asset
  // record's `category="Production"`), and forcing those into arrays too
  // silently corrupts unrelated fields.
  isArray: (tagName, _jPath, _isLeafNode, isAttribute) => !isAttribute && ALWAYS_ARRAY.has(tagName),
});

/** Unwraps `{ rootTag: {...} }` down to `{...}` — the outer tag is just the
 * XML document element and carries no meaning of its own (mirrors how the
 * equivalent JSON body has no such wrapper). */
function unwrapXmlRoot(parsed: Record<string, unknown>): unknown {
  const keys = Object.keys(parsed).filter((k) => k !== "?xml");
  if (keys.length !== 1) return parsed;
  return parsed[keys[0]];
}

async function requestFrom<T>(
  root: string,
  path: string,
  init: RequestInit | undefined,
  format: "json" | "xml"
): Promise<T> {
  const res = await fetch(`${root}${path}`, {
    ...init,
    headers: {
      Accept: format === "xml" ? "application/xml, text/xml" : "application/json",
      "Content-Type": "application/json",
      ...authHeader(),
      ...(init?.headers ?? {}),
    },
    // RoutingNMS state changes often (alarms/events/metrics) — never cache silently.
    cache: "no-store",
  });

  if (!res.ok) {
    // Try to surface the server's own error text (OpenNMS often replies with
    // a short plaintext/XML message like "'name' must not be null") instead
    // of just the status code — makes broken-endpoint diagnosis much faster.
    const bodyText = await res.text().catch(() => "");
    const detail = bodyText && bodyText.length < 300 ? ` — ${bodyText.trim()}` : "";
    throw new Error(`RoutingNMS API ${path} failed: ${res.status} ${res.statusText}${detail}`);
  }

  const text = await res.text();
  if (!text) return undefined as T;

  const trimmed = text.trimStart();
  if (format === "xml" || trimmed.startsWith("<")) {
    const parsed = xmlParser.parse(text) as Record<string, unknown>;
    return unwrapXmlRoot(parsed) as T;
  }
  return JSON.parse(text) as T;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return requestFrom<T>(API_V2, path, init, "json");
}

async function requestV1<T>(path: string, init?: RequestInit): Promise<T> {
  return requestFrom<T>(API_V1, path, init, "xml");
}

// ---- Types (trimmed to what the UI needs; RoutingNMS returns more) --------

export type OnmsNode = {
  id: number;
  label: string;
  foreignSource?: string;
  sysLocation?: string;
  createTime?: string;
};

export type OnmsAlarm = {
  id: number;
  severityLabel: string; // NORMAL | WARNING | MINOR | MAJOR | CRITICAL
  logMsg?: { content?: string };
  nodeLabel?: string;
  firstEventTime?: string;
  lastEventTime?: string;
  ackUser?: string | null;
  counter?: number;
};

export type OnmsEvent = {
  id: number;
  uei: string;
  nodeLabel?: string;
  logMessage?: string;
  time?: string;
  severity?: string;
};

export type OnmsOutage = {
  id: number;
  nodeLabel?: string;
  ipAddress?: string;
  serviceName?: string;
  ifLostService?: string;
  ifRegainedService?: string | null;
};

export type OnmsLink = {
  nodeIdA: number;
  nodeIdB: number;
  ifIndexA?: number;
  ifIndexB?: number;
  status?: string;
};

export type OnmsResource = {
  id: string;
  label: string;
  name: string;
  typeLabel?: string;
  rrdGraphAttributes?: Record<string, { name: string; rrdFile: string }>;
  children?: { resource?: OnmsResource[] };
};

export type MeasurementSource = {
  resourceId: string;
  attribute: string;
  aggregation?: "AVERAGE" | "MIN" | "MAX";
  label: string;
};

export type MeasurementPoint = { timestamp: number; values: (number | null)[] };

export type OnmsRequisitionNode = {
  foreignId: string;
  nodeLabel: string;
  interfaces?: { ipAddress: string }[];
};

export type OnmsRequisition = {
  foreignSource: string;
  nodeCount: number;
  lastImport?: string | null;
};

export type OnmsNotification = {
  id: number;
  textMsg?: string;
  subject?: string;
  nodeLabel?: string;
  pageTime?: string;
  respondTime?: string | null;
  respondUser?: string | null;
};

export type OnmsUser = {
  userId: string;
  fullName?: string;
  email?: string;
  comments?: string;
};

export type OnmsGroup = {
  name: string;
  comments?: string;
  userCount: number;
};

export type OnmsBusinessService = {
  id: number;
  name: string;
  operationalStatus?: string; // NORMAL | WARNING | MINOR | MAJOR | CRITICAL | INDETERMINATE
  reductionKeys?: number;
  childEdges?: number;
};

export type OnmsMinion = {
  id: string;
  label?: string;
  location?: string;
  lastUpdated?: string;
  status?: string; // STARTED | STOPPED | UNRESPONSIVE, reported as a property map on some versions
};

export type OnmsCategory = {
  name: string;
  description?: string;
  nodeCount: number;
};

export type OnmsReportDefinition = {
  id: string;
  displayName?: string;
  description?: string;
  online?: boolean;
};

export type OnmsInterface = {
  nodeId: number;
  nodeLabel?: string;
  ipAddress: string;
  isPrimary?: boolean;
  snmpIfDescr?: string;
  snmpIfAlias?: string;
  snmpIfOperStatus?: number; // 1 = up, 2 = down
};

export type OnmsAsset = {
  nodeId: number;
  nodeLabel?: string;
  category?: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  assetNumber?: string;
  region?: string;
  building?: string;
  room?: string;
  rack?: string;
  vendor?: string;
  description?: string;
};

// ---- API surface ---------------------------------------------------------

export const routingnms = {
  async listNodes(limit = 100): Promise<{ count: number; nodes: OnmsNode[] }> {
    const data = await request<{ count: number; totalCount: number; node: OnmsNode[] }>(
      `/nodes?limit=${limit}`
    );
    return { count: data.totalCount ?? data.count ?? 0, nodes: data.node ?? [] };
  },

  async listAlarms(limit = 100): Promise<{ count: number; alarms: OnmsAlarm[] }> {
    const data = await request<{ count: number; totalCount: number; alarm: OnmsAlarm[] }>(
      `/alarms?limit=${limit}&orderBy=lastEventTime&order=desc`
    );
    return { count: data.totalCount ?? data.count ?? 0, alarms: data.alarm ?? [] };
  },

  async listEvents(limit = 100): Promise<{ count: number; events: OnmsEvent[] }> {
    const data = await request<{ count: number; totalCount: number; event: OnmsEvent[] }>(
      `/events?limit=${limit}&orderBy=time&order=desc`
    );
    return { count: data.totalCount ?? data.count ?? 0, events: data.event ?? [] };
  },

  async listOutages(limit = 100): Promise<{ count: number; outages: OnmsOutage[] }> {
    const data = await request<{ count: number; totalCount: number; outage: OnmsOutage[] }>(
      `/outages?limit=${limit}`
    );
    return { count: data.totalCount ?? data.count ?? 0, outages: data.outage ?? [] };
  },

  /** Enlinkd-discovered links between nodes (CDP/LLDP/OSPF/etc.). Schema
   * varies a bit across RoutingNMS versions, so this reads defensively and
   * returns an empty list (never throws) if the endpoint or fields don't
   * match — the topology page still renders nodes-only in that case. */
  async listLinks(): Promise<OnmsLink[]> {
    try {
      const data = await requestV1<{ link?: Record<string, unknown>[] } | Record<string, unknown>[]>(
        `/links`
      );
      const raw = Array.isArray(data) ? data : data.link ?? [];
      return raw
        .map((l) => ({
          nodeIdA: Number(l.nodeIdA ?? l.nodeId1 ?? l.sourceNodeId),
          nodeIdB: Number(l.nodeIdB ?? l.nodeId2 ?? l.targetNodeId),
          ifIndexA: l.ifIndexA != null ? Number(l.ifIndexA) : undefined,
          ifIndexB: l.ifIndexB != null ? Number(l.ifIndexB) : undefined,
          status: typeof l.status === "string" ? l.status : undefined,
        }))
        .filter((l) => Number.isFinite(l.nodeIdA) && Number.isFinite(l.nodeIdB));
    } catch {
      return [];
    }
  },

  /** Resource tree for one node — interfaces, response-time, etc. Each
   * resource's `rrdGraphAttributes` keys are the metric names that can be
   * queried via `queryMeasurements`. */
  async nodeResources(nodeId: number): Promise<OnmsResource[]> {
    const data = await requestV1<{ children?: { resource?: OnmsResource[] } }>(
      `/resources/fornode/${nodeId}`
    );
    return data.children?.resource ?? [];
  },

  /** Real time-series data from RoutingNMS's measurements engine (backed by
   * RRD or Newts, whichever this instance is configured with — this
   * client doesn't need to know which). */
  async queryMeasurements(opts: {
    start: number;
    end: number;
    step?: number;
    sources: MeasurementSource[];
  }): Promise<{ labels: string[]; points: MeasurementPoint[] }> {
    const data = await requestV1<{
      labels?: string[];
      timestamps?: number[];
      columns?: { values: (number | null)[] }[];
    }>(`/measurements`, {
      method: "POST",
      body: JSON.stringify({
        start: opts.start,
        end: opts.end,
        step: opts.step ?? 60000,
        source: opts.sources,
      }),
    });

    const timestamps = data.timestamps ?? [];
    const columns = data.columns ?? [];
    const points: MeasurementPoint[] = timestamps.map((timestamp, i) => ({
      timestamp,
      values: columns.map((c) => c.values[i] ?? null),
    }));
    return { labels: data.labels ?? opts.sources.map((s) => s.label), points };
  },

  /** Provisioning requisitions (foreign-source device groups awaiting or
   * already imported). Reads defensively — some fields differ slightly
   * across versions — same pattern as listLinks. */
  async listRequisitions(): Promise<OnmsRequisition[]> {
    try {
      const data = await requestV1<
        { "model-import"?: Record<string, unknown>[] } | Record<string, unknown>[]
      >(`/requisitions`);
      const raw = Array.isArray(data) ? data : data["model-import"] ?? [];
      return raw.map((r) => ({
        foreignSource: String(r["foreign-source"] ?? r.foreignSource ?? "unknown"),
        nodeCount: Array.isArray(r.node) ? r.node.length : Number(r.nodeCount ?? 0),
        lastImport: typeof r["date-stamp"] === "string" ? (r["date-stamp"] as string) : null,
      }));
    } catch {
      return [];
    }
  },

  /** Nodes pending inside one requisition — the "about to be provisioned"
   * list, distinct from real Node inventory until it's imported. */
  async requisitionNodes(foreignSource: string): Promise<OnmsRequisitionNode[]> {
    try {
      const data = await requestV1<{ node?: Record<string, unknown>[] }>(
        `/requisitions/${encodeURIComponent(foreignSource)}`
      );
      const raw = data.node ?? [];
      return raw.map((n) => ({
        foreignId: String(n["foreign-id"] ?? n.foreignId ?? ""),
        nodeLabel: String(n["node-label"] ?? n.nodeLabel ?? "Unnamed"),
        interfaces: Array.isArray(n.interface)
          ? (n.interface as Record<string, unknown>[]).map((i) => ({
              ipAddress: String(i["ip-addr"] ?? i.ipAddress ?? ""),
            }))
          : [],
      }));
    } catch {
      return [];
    }
  },

  /** Triggers RoutingNMS's own real import for one requisition — the same
   * action the classic Provisioning UI's "Import" button performs. Newly
   * added/edited devices only become real monitored nodes after this
   * runs. */
  async importRequisition(foreignSource: string): Promise<void> {
    await requestV1<void>(
      `/requisitions/${encodeURIComponent(foreignSource)}/import?rescanExisting=true`,
      { method: "PUT" }
    );
  },

  /** Notices sent to on-call users about alarms. Read defensively — same
   * reasoning as listLinks/listRequisitions: the exact field names have
   * drifted a bit across versions, never worth a hard crash over. */
  async listNotifications(limit = 100): Promise<{ count: number; notifications: OnmsNotification[] }> {
    try {
      const data = await request<{
        count: number;
        totalCount: number;
        notification: Record<string, unknown>[];
      }>(`/notifications?limit=${limit}&orderBy=pageTime&order=desc`);
      const raw = data.notification ?? [];
      return {
        count: data.totalCount ?? data.count ?? 0,
        notifications: raw.map((n) => ({
          id: Number(n.id),
          textMsg: typeof n.textMsg === "string" ? n.textMsg : undefined,
          subject: typeof n.subject === "string" ? n.subject : undefined,
          nodeLabel: typeof n.nodeLabel === "string" ? n.nodeLabel : undefined,
          pageTime: typeof n.pageTime === "string" ? n.pageTime : undefined,
          respondTime: typeof n.respondTime === "string" ? n.respondTime : null,
          respondUser: typeof n.respondUser === "string" ? n.respondUser : null,
        })),
      };
    } catch {
      return { count: 0, notifications: [] };
    }
  },

  /** Configured users — admin/ops accounts, not monitored-device data.
   * Reads defensively: the v1 users endpoint's schema varies by version. */
  async listUsers(): Promise<OnmsUser[]> {
    try {
      const data = await requestV1<{ user?: Record<string, unknown>[] } | Record<string, unknown>[]>(
        `/users`
      );
      const raw = Array.isArray(data) ? data : data.user ?? [];
      return raw.map((u) => ({
        userId: String(u["user-id"] ?? u.userId ?? u.username ?? "unknown"),
        fullName: typeof u["full-name"] === "string" ? (u["full-name"] as string) : undefined,
        email: typeof u.email === "string" ? (u.email as string) : undefined,
        // The real instance's v1 XML uses <user-comments>, not <comments>
        // (confirmed against a live curl) — read both, new field first.
        comments:
          typeof u["user-comments"] === "string"
            ? (u["user-comments"] as string)
            : typeof u.comments === "string"
              ? (u.comments as string)
              : undefined,
      }));
    } catch {
      return [];
    }
  },

  /** Configured groups — same defensive pattern. */
  async listGroups(): Promise<OnmsGroup[]> {
    try {
      const data = await requestV1<{ group?: Record<string, unknown>[] } | Record<string, unknown>[]>(
        `/groups`
      );
      const raw = Array.isArray(data) ? data : data.group ?? [];
      return raw.map((g) => ({
        name: String(g.name ?? "unnamed"),
        comments: typeof g.comments === "string" ? (g.comments as string) : undefined,
        userCount: Array.isArray((g as Record<string, unknown>).user)
          ? ((g as Record<string, unknown>).user as unknown[]).length
          : 0,
      }));
    } catch {
      return [];
    }
  },

  // Node inventory / asset records — classic "Asset Management" screen.
  // The v1 REST API embeds an assetRecord object per node; schema has
  // drifted across RoutingNMS versions, so every field is read defensively.
  async listAssets(limit = 200): Promise<OnmsAsset[]> {
    try {
      const data = await requestV1<{ node?: Record<string, unknown>[] } | Record<string, unknown>[]>(
        `/nodes?limit=${limit}`
      );
      const raw = Array.isArray(data) ? data : data.node ?? [];
      return raw
        .map((n) => {
          const asset = (n.assetRecord ?? {}) as Record<string, unknown>;
          const str = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v : undefined);
          return {
            nodeId: Number(n.id),
            nodeLabel: str(n.label),
            category: str(asset.category),
            manufacturer: str(asset.manufacturer),
            modelNumber: str(asset.modelNumber),
            serialNumber: str(asset.serialNumber),
            assetNumber: str(asset.assetNumber),
            region: str(asset.region),
            building: str(asset.building),
            room: str(asset.room),
            rack: str(asset.rack),
            vendor: str(asset.vendor),
            description: str(asset.description),
          };
        })
        .filter(
          (a) =>
            a.manufacturer || a.modelNumber || a.serialNumber || a.assetNumber || a.region || a.building
        );
    } catch {
      return [];
    }
  },

  // IP/SNMP interfaces per node — the "Interfaces" tab on the classic node
  // detail page, flattened across nodes into one list. Capped at
  // `nodeLimit` nodes and fetched in parallel; any one node's failure
  // (unsupported field, unreachable, etc.) is swallowed so the rest of the
  // table still renders.
  async listInterfaces(nodeLimit = 60): Promise<OnmsInterface[]> {
    try {
      const nodeData = await requestV1<{ node?: Record<string, unknown>[] } | Record<string, unknown>[]>(
        `/nodes?limit=${nodeLimit}`
      );
      const nodes = Array.isArray(nodeData) ? nodeData : nodeData.node ?? [];

      const perNode = await Promise.all(
        nodes.map(async (n) => {
          const nodeId = Number(n.id);
          const nodeLabel = typeof n.label === "string" ? n.label : undefined;
          try {
            const data = await requestV1<
              { ipInterface?: Record<string, unknown>[] } | Record<string, unknown>[]
            >(`/nodes/${nodeId}/ipinterfaces`);
            const raw = Array.isArray(data) ? data : data.ipInterface ?? [];
            return raw.map((i): OnmsInterface => {
              const snmp = (i.snmpInterface ?? {}) as Record<string, unknown>;
              return {
                nodeId,
                nodeLabel,
                ipAddress: String(i.ipAddress ?? i["ip-address"] ?? "unknown"),
                isPrimary:
                  i.snmpPrimary === "P" ||
                  i["snmp-primary"] === "P" ||
                  i.isPrimary === true ||
                  i.isPrimary === "true",
                snmpIfDescr: typeof snmp.ifDescr === "string" ? (snmp.ifDescr as string) : undefined,
                snmpIfAlias: typeof snmp.ifAlias === "string" ? (snmp.ifAlias as string) : undefined,
                // XML attribute values come back as strings, not numbers.
                snmpIfOperStatus:
                  snmp.ifOperStatus != null && !Number.isNaN(Number(snmp.ifOperStatus))
                    ? Number(snmp.ifOperStatus)
                    : undefined,
              };
            });
          } catch {
            return [];
          }
        })
      );

      return perNode.flat();
    } catch {
      return [];
    }
  },

  // Business Service Monitoring — composite "service health" rollups built
  // from alarms/IP services. Newer Horizon versions serve this from v2;
  // older ones only had it under v1. We try v2 first and fall back to v1
  // so this keeps working across the version spread, same defensive
  // approach as everything else that touches a less-stable endpoint.
  async listBusinessServices(): Promise<OnmsBusinessService[]> {
    const parse = (raw: Record<string, unknown>[]): OnmsBusinessService[] =>
      raw.map((b) => {
        const status = b["operational-status"] ?? b.operationalStatus;
        const statusLabel =
          typeof status === "string"
            ? status
            : typeof (status as Record<string, unknown>)?.label === "string"
              ? ((status as Record<string, unknown>).label as string)
              : undefined;
        return {
          id: Number(b.id),
          name: String(b.name ?? "Unnamed service"),
          operationalStatus: statusLabel,
          reductionKeys: Array.isArray(b["reduction-keys"])
            ? (b["reduction-keys"] as unknown[]).length
            : undefined,
          childEdges: Array.isArray(b.edges) ? (b.edges as unknown[]).length : undefined,
        };
      });

    try {
      const data = await request<{ businessService?: Record<string, unknown>[] } | Record<string, unknown>[]>(
        `/business-services`
      );
      const raw = Array.isArray(data) ? data : data.businessService ?? [];
      return parse(raw);
    } catch {
      try {
        const data = await requestV1<
          { "business-service"?: Record<string, unknown>[] } | Record<string, unknown>[]
        >(`/business-services`);
        const raw = Array.isArray(data) ? data : data["business-service"] ?? [];
        return parse(raw);
      } catch {
        return [];
      }
    }
  },

  // Catalog of available report definitions (the "Reports" tab of the
  // classic console) — the Jasper/BIRT report engine's own list, read via
  // the reports REST resource. This is the report CATALOG only: generating
  // and downloading an actual rendered report is a separate, multi-step
  // REST flow (trigger a run, poll status, fetch the output) that we're
  // not wiring up yet — listing what's available is the useful first step.
  async listReportDefinitions(): Promise<OnmsReportDefinition[]> {
    // The real instance 500s on `/reports/list` with `'name' must not be
    // null` — that looks like a resource that wants a query param (e.g. a
    // repository id) rather than a broken deployment, but without a working
    // reference we can't be sure of the right one yet. Try the plain
    // `/reports` catalog resource as a fallback before giving up.
    let data: Record<string, unknown>[] | { report?: Record<string, unknown>[] };
    try {
      data = await requestV1<Record<string, unknown>[] | { report?: Record<string, unknown>[] }>(
        `/reports/list`
      );
    } catch {
      try {
        data = await requestV1<Record<string, unknown>[] | { report?: Record<string, unknown>[] }>(
          `/reports`
        );
      } catch {
        return [];
      }
    }
    try {
      const raw = Array.isArray(data) ? data : data.report ?? [];
      return raw.map((r) => ({
        id: String(r.id ?? r.reportId ?? "unknown"),
        displayName:
          typeof r.displayName === "string"
            ? r.displayName
            : typeof r["display-name"] === "string"
              ? (r["display-name"] as string)
              : undefined,
        description: typeof r.description === "string" ? (r.description as string) : undefined,
        online: typeof r.online === "boolean" ? (r.online as boolean) : undefined,
      }));
    } catch {
      return [];
    }
  },

  // Surveillance categories — the tag-like grouping (e.g. "Routers",
  // "Production") that feeds the classic Surveillance view and category-
  // based dashboards. /categories lists definitions; each node's own
  // membership comes back nested on some versions and as a separate
  // per-category node list on others, so node counts are read from
  // whichever shape is present.
  async listCategories(): Promise<OnmsCategory[]> {
    try {
      const data = await requestV1<
        { category?: Record<string, unknown>[] } | Record<string, unknown>[]
      >(`/categories`);
      const raw = Array.isArray(data) ? data : data.category ?? [];
      return raw.map((c) => ({
        name: String(c.name ?? "unnamed"),
        description: typeof c.description === "string" ? (c.description as string) : undefined,
        nodeCount: Array.isArray((c as Record<string, unknown>).node)
          ? ((c as Record<string, unknown>).node as unknown[]).length
          : Number(c.nodeCount ?? c["node-count"] ?? 0),
      }));
    } catch {
      return [];
    }
  },

  // Minions — distributed monitoring agents (Horizon's remote pollers).
  // v2 /minions is the modern location for this; older setups without
  // Minions configured will just get a 404/empty result, which we treat
  // as "none deployed" rather than an error.
  async listMinions(): Promise<OnmsMinion[]> {
    try {
      const data = await request<{ minion?: Record<string, unknown>[] } | Record<string, unknown>[]>(
        `/minions`
      );
      const raw = Array.isArray(data) ? data : data.minion ?? [];
      return raw.map((m) => {
        const status = m.status ?? (m.properties as Record<string, unknown> | undefined)?.status;
        return {
          id: String(m.id ?? "unknown"),
          label: typeof m.label === "string" ? (m.label as string) : undefined,
          location: typeof m.location === "string" ? (m.location as string) : undefined,
          lastUpdated:
            typeof m.lastUpdated === "string"
              ? (m.lastUpdated as string)
              : typeof m["last-updated"] === "string"
                ? (m["last-updated"] as string)
                : undefined,
          status: typeof status === "string" ? status : undefined,
        };
      });
    } catch {
      return [];
    }
  },

  /** Single node's own record — the standard, stable v2 node-by-id
   * endpoint. Used by the Node Detail page alongside its interfaces and
   * asset record. */
  async getNode(nodeId: number): Promise<OnmsNode | null> {
    try {
      const n = await request<Record<string, unknown>>(`/nodes/${nodeId}`);
      return {
        id: Number(n.id),
        label: String(n.label ?? `Node ${nodeId}`),
        foreignSource: typeof n.foreignSource === "string" ? n.foreignSource : undefined,
        sysLocation: typeof n.location === "string" ? n.location : undefined,
        createTime: typeof n.createTime === "string" ? n.createTime : undefined,
      };
    } catch {
      return null;
    }
  },

  /** IP/SNMP interfaces for one node — same shape as listInterfaces but
   * scoped to a single node, for the detail page (avoids re-fetching every
   * node's interfaces just to show one). */
  async nodeInterfaces(nodeId: number): Promise<OnmsInterface[]> {
    try {
      const data = await requestV1<
        { ipInterface?: Record<string, unknown>[] } | Record<string, unknown>[]
      >(`/nodes/${nodeId}/ipinterfaces`);
      const raw = Array.isArray(data) ? data : data.ipInterface ?? [];
      return raw.map((i): OnmsInterface => {
        const snmp = (i.snmpInterface ?? {}) as Record<string, unknown>;
        return {
          nodeId,
          ipAddress: String(i.ipAddress ?? i["ip-address"] ?? "unknown"),
          isPrimary:
            i.snmpPrimary === "P" ||
            i["snmp-primary"] === "P" ||
            i.isPrimary === true ||
            i.isPrimary === "true",
          snmpIfDescr: typeof snmp.ifDescr === "string" ? (snmp.ifDescr as string) : undefined,
          snmpIfAlias: typeof snmp.ifAlias === "string" ? (snmp.ifAlias as string) : undefined,
          snmpIfOperStatus:
            snmp.ifOperStatus != null && !Number.isNaN(Number(snmp.ifOperStatus))
              ? Number(snmp.ifOperStatus)
              : undefined,
        };
      });
    } catch {
      return [];
    }
  },

  /** Asset record for one node — scoped version of listAssets. */
  async nodeAsset(nodeId: number): Promise<OnmsAsset | null> {
    try {
      const asset = await requestV1<Record<string, unknown>>(`/nodes/${nodeId}/assetRecord`);
      const str = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v : undefined);
      return {
        nodeId,
        category: str(asset.category),
        manufacturer: str(asset.manufacturer),
        modelNumber: str(asset.modelNumber),
        serialNumber: str(asset.serialNumber),
        assetNumber: str(asset.assetNumber),
        region: str(asset.region),
        building: str(asset.building),
        room: str(asset.room),
        rack: str(asset.rack),
        vendor: str(asset.vendor),
        description: str(asset.description),
      };
    } catch {
      return null;
    }
  },
};
