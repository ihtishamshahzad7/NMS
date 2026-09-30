"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const BASE_URL = process.env.ROUTINGNMS_API_URL ?? "http://localhost:8980/routingnms";
const SESSION_COOKIE = "rnms_session";

export async function login(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Enter both a username and password." };
  }

  // Verify the entered credentials are real by making one lightweight,
  // real call against RoutingNMS's own API — this is an app-level login
  // gate in front of the service account already configured via
  // ROUTINGNMS_API_USER/PASSWORD, not a replacement for it. Whoever logs
  // in still rides on that service account for actual data access.
  const token = Buffer.from(`${username}:${password}`).toString("base64");
  let valid = false;
  try {
    const res = await fetch(`${BASE_URL}/api/v2/nodes?limit=1`, {
      headers: { Accept: "application/json", Authorization: `Basic ${token}` },
      cache: "no-store",
    });
    valid = res.ok;
  } catch {
    return { error: "Couldn't reach RoutingNMS to verify credentials. Check the backend is running." };
  }

  if (!valid) {
    return { error: "Invalid username or password." };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, username, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12h
  });

  redirect("/dashboard");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
