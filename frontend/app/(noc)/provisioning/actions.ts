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
