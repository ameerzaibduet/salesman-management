"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";

const BACK = "/admin/off-days";
const done = (key: "ok" | "error", msg: string) => redirect(`${BACK}?${key}=${encodeURIComponent(msg)}`);

export async function saveWeekdays(formData: FormData) {
  const { supabase } = await requireRole("admin");
  const off = formData
    .getAll("off")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  const { error } = await supabase.from("alert_settings").upsert({ id: true, off_weekdays: off });
  revalidatePath("/", "layout");
  done(error ? "error" : "ok", error ? error.message : "Weekly off days saved.");
}

export async function addIgnoredDay(formData: FormData) {
  const { supabase } = await requireRole("admin");
  const day = String(formData.get("day") || "");
  const note = String(formData.get("note") || "").trim() || null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) done("error", "Choose a date.");
  const { error } = await supabase.from("ignored_days").upsert({ day, note });
  revalidatePath("/", "layout");
  done(error ? "error" : "ok", error ? error.message : "Day will be ignored.");
}

export async function removeIgnoredDay(formData: FormData) {
  const { supabase } = await requireRole("admin");
  const { error } = await supabase.from("ignored_days").delete().eq("day", String(formData.get("day")));
  revalidatePath("/", "layout");
  done(error ? "error" : "ok", error ? error.message : "Removed.");
}
