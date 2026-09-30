"use server";

import { revalidatePath } from "next/cache";
import { routingnms } from "@/lib/routingnms-client";

export async function runImport(foreignSource: string) {
  try {
    await routingnms.importRequisition(foreignSource);
    revalidatePath("/provisioning");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Import failed" };
  }
}

export type AddDeviceResult =
  | { ok: true; imported: boolean }
  | { ok: false; error: string };

export async function addDeviceAction(formData: FormData): Promise<AddDeviceResult> {
  const foreignSource = String(formData.get("foreignSource") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const ip = String(formData.get("ip") ?? "").trim();
  const community = String(formData.get("community") ?? "").trim();
  const version = String(formData.get("version") ?? "v2c").trim();
  const autoImport = formData.get("autoImport") === "on";

  if (!foreignSource || !label || !ip) {
    return { ok: false, error: "Foreign source, device label, and IP address are all required." };
  }

  const foreignId = `${label.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase()}-${Date.now().toString(36)}`;

  try {
    await routingnms.addRequisitionNode(foreignSource, { foreignId, label, ip });

    if (community) {
      // Best-effort — the device is provisioned either way; a failed SNMP
      // override just means it'll poll with whatever default config OpenNMS
      // already has for this IP range instead of the one just entered.
      try {
        await routingnms.setSnmpConfig(ip, { community, version });
      } catch {
        // swallow — surfaced implicitly by the SNMP panel on the node page
      }
    }

    if (autoImport) {
      await routingnms.importRequisition(foreignSource);
    }

    revalidatePath("/provisioning");
    revalidatePath("/nodes");
    revalidatePath("/dashboard");
    return { ok: true, imported: autoImport };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Adding the device failed" };
  }
}

export type SnmpConfigResult = { ok: true } | { ok: false; error: string };

export async function saveSnmpConfigAction(
  ip: string,
  community: string,
  version: string
): Promise<SnmpConfigResult> {
  if (!ip || !community) {
    return { ok: false, error: "IP address and community are both required." };
  }
  try {
    await routingnms.setSnmpConfig(ip, { community, version });
    revalidatePath("/nodes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Saving SNMP config failed" };
  }
}
