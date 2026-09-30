"use server";

import { revalidatePath } from "next/cache";
import { routingnms } from "@/lib/routingnms-client";

export type NotificationActionResult = { ok: true } | { ok: false; error: string };

export async function acknowledgeNotificationAction(id: number): Promise<NotificationActionResult> {
  try {
    await routingnms.acknowledgeNotification(id);
    revalidatePath("/notifications");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Acknowledge failed" };
  }
}
