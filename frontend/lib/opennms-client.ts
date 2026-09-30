/**
 * Thin client for OpenNMS's own REST API (v2, JSON) — the same API its
 * stock Vaadin/JSP web UI already runs on. We never touch the Java
 * backend; this file is the ONLY place that knows the wire format, so a
 * future backend-side change (or moving from Basic Auth to something
 * else) is a one-file fix.
 *
 * Auth: OpenNMS's REST API accepts HTTP Basic Auth by default
 * (the same admin/user credentials as the classic web UI). Configure
 * the base URL + credentials via env vars — see .env.example.
 */

const BASE_URL = process.env.OPENNMS_BASE_URL ?? "http://localhost:8980/opennms";
const API_V2 = `${BASE_URL}/api/v2`;
// The resource tree and the measurements query engine were never migrated
// to v2 in upstream OpenNMS — they're still served from the older v1 REST
// API. Both live clients hit the same server, just a different path root.
const API_V1 = `${BASE_URL}/rest`;

function authHeader(): Record<string, string> {
  const user = process.env.OPENNMS_USER;
  const pass = process.env.OPENNMS_PASSWORD;
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
    // OpenNMS state changes often (alarms/events/metrics) — never cache silently.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`OpenNMS API ${path} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return requestFrom<T>(API_V2, path, init);
}

async function requestV1<T>(path: string, init?: RequestInit): Promise<T> {
  return requestFrom<T>(API_V1, path, init);
}

// ---- Types (trimmed to what the UI needs; OpenNMS returns more) --------

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

// ---- API surface ---------------------------------------------------------

export const opennms = {
  async listNodes(limit = 100): Promise<{ count: number; nodes: OnmsNode[] }> {
    const data = await request<{ count: number; totalCount: number; node: OnmsNode[] }>(
      `/nodes?limit=${limit}`
    );
    return { count: data.totalCount ?? data.count ?? 0, nodes: data.node ?? [] };
  },