"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";

function safeBack(v: FormDataEntryValue | null) {
  const s = String(v ?? "");
  return /^\/admin\/missed(\?salesman=[0-9a-f-]{36})?$/.test(s) ? s : "/admin/missed";
}
function go(back: string, key: "ok" | "error", msg: string): never {
  redirect(`${back}${back.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(msg)}`);
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function reviewSkip(formData: FormData) {
  const { supabase, user } = await requireRole("admin");
  const back = safeBack(formData.get("back"));
  const decision = String(formData.get("decision"));
  const reason = String(formData.get("reason") || "").trim();
  if (!["approved", "rejected"].includes(decision)) go(back, "error", "Invalid decision.");
  if (decision === "rejected" && !reason) go(back, "error", "Write a reason for rejecting.");

  const { error } = await supabase
    .from("day_skips")
    .update({
      status: decision,
      rejection_reason: decision === "rejected" ? reason : null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", String(formData.get("id")))
    .eq("status", "pending");
  revalidatePath("/", "layout");
  go(back, error ? "error" : "ok", error ? error.message : decision === "approved" ? "Skip approved." : "Skip rejected.");
}

/** Admin ignores one date for one salesman. */
export async function ignoreDay(formData: FormData) {
  const { supabase, user } = await requireRole("admin");
  const back = safeBack(formData.get("back"));
  const salesman_id = String(formData.get("salesman_id"));
  const skip_date = String(formData.get("date"));
  if (!ISO.test(skip_date)) go(back, "error", "Invalid date.");
  const { error } = await supabase.from("day_skips").upsert(
    {
      salesman_id,
      skip_date,
      reason: String(formData.get("reason") || "").trim() || "Ignored by admin",
      status: "approved",
      rejection_reason: null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    },
    { onConflict: "salesman_id,skip_date" }
  );
  revalidatePath("/", "layout");
  go(back, error ? "error" : "ok", error ? error.message : "Day ignored.");
}

/** Admin ignores a date range for one salesman (e.g. he was on leave). */
export async function ignoreRange(formData: FormData) {
  const { supabase, user } = await requireRole("admin");
  const back = safeBack(formData.get("back"));
  const salesman_id = String(formData.get("salesman_id") || "");
  const from = String(formData.get("from") || "");
  const to = String(formData.get("to") || from);
  const reason = String(formData.get("reason") || "").trim() || "Ignored by admin";
  if (!salesman_id) go(back, "error", "Choose a salesman.");
  if (!ISO.test(from) || !ISO.test(to) || from > to) go(back, "error", "Choose a valid date range.");

  const rows: object[] = [];
  const d = new Date(from + "T00:00:00Z");
  const end = new Date(to + "T00:00:00Z");
  while (d <= end && rows.length < 400) {
    rows.push({
      salesman_id,
      skip_date: d.toISOString().slice(0, 10),
      reason,
      status: "approved",
      rejection_reason: null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    });
    d.setUTCDate(d.getUTCDate() + 1);
  }
  const { error } = await supabase.from("day_skips").upsert(rows, { onConflict: "salesman_id,skip_date" });
  revalidatePath("/", "layout");
  go(back, error ? "error" : "ok", error ? error.message : `${rows.length} day(s) ignored.`);
}

/** Undo an ignore / approved skip (the day counts as missed again if there is no entry). */
export async function undoSkip(formData: FormData) {
  const { supabase } = await requireRole("admin");
  const back = safeBack(formData.get("back"));
  const { error } = await supabase.from("day_skips").delete().eq("id", String(formData.get("id")));
  revalidatePath("/", "layout");
  go(back, error ? "error" : "ok", error ? error.message : "Undone.");
}
