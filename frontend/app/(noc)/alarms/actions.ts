"use server";

import { revalidatePath } from "next/cache";
import { routingnms } from "@/lib/routingnms-client";

export type AlarmActionResult = { ok: true } | { ok: false; error: string };

export async function acknowledgeAlarmAction(id: number, ack: boolean): Promise<AlarmActionResult> {
  try {
    await routingnms.acknowledgeAlarm(id, ack);
    revalidatePath("/alarms");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Acknowledge failed" };
  }
}

export async function clearAlarmAction(id: number): Promise<AlarmActionResult> {
  try {
    await routingnms.clearAlarm(id);
    revalidatePath("/alarms");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Clear failed" };
  }
}

export async function escalateAlarmAction(id: number): Promise<AlarmActionResult> {
  try {
    await routingnms.escalateAlarm(id);
    revalidatePath("/alarms");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Escalate failed" };
  }
}
