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

const BASE_URL = process.env.ROUTINGNMS_API_URL ?? "http://localhost:8980/routingnms";
const API_V2 = `${BASE_URL}/api/v2`;
// The resource tree and the measurements query engine were never migrated
// to v2 in upstream RoutingNMS — they're still served from the older v1 REST
// API. Both live clients hit the same server, just a different path root.
const API_V1 = `${BASE_URL}/rest`;

function authHeader(): Record<string, string> {
  const user = process.env.ROUTINGNMS_API_USER;
  const pass = process.env.ROUTINGNMS_API_PASSWORD;
  if (!user || !pass) return {};
  const token = Buffer.from(`${user}:${pass}`).toString("base64");
  return { Authorization: `Basic ${token}` };
}

async function requestFrom<T>(root: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${root}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...authHeader(),
      ...(init?.headers ?? {}),
    },
    // RoutingNMS state changes often (alarms/events/metrics) — never cache silently.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`RoutingNMS API ${path} failed: ${res.status} ${res.statusText}`);
  }
  // Some endpoints (e.g. the import trigger) reply 200/204 with no body —
  // res.json() throws on empty text, so only parse when there's content.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return requestFrom<T>(API_V2, path, init);
}

async function requestV1<T>(path: string, init?: RequestInit): Promise<T> {
  return requestFrom<T>(API_V1, path, init);
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
        comments: typeof u.comments === "string" ? (u.comments as string) : undefined,
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
};
