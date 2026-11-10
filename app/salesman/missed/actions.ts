"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";
import { today } from "@/lib/format";

const BACK = "/salesman/missed";
const done = (key: "ok" | "error", msg: string) => redirect(`${BACK}?${key}=${encodeURIComponent(msg)}`);

export async function requestSkip(formData: FormData) {
  const { supabase, user } = await requireRole("salesman");
  const skip_date = String(formData.get("date") || "");
  const reason = String(formData.get("reason") || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(skip_date)) done("error", "Invalid date.");
  if (skip_date >= today()) done("error", "Only past days can be skipped.");
  if (reason.length < 3) done("error", "Please write a reason.");

  const { error } = await supabase.from("day_skips").insert({ salesman_id: user.id, skip_date, reason });
  revalidatePath("/", "layout");
  if (error) {
    done("error", error.code === "23505" ? "You already sent a skip request for this day." : error.message);
  }
  done("ok", "Skip request sent. The admin will confirm it.");
}
