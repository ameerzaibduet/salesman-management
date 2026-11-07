"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";

const BACK = "/admin/rain-suits";
const done = (key: "ok" | "error", msg: string) => redirect(`${BACK}?${key}=${encodeURIComponent(msg)}`);

export async function setCost(formData: FormData) {
  const { supabase } = await requireRole("admin");
  const effective_from = String(formData.get("effective_from") || "");
  const cost = Number(formData.get("cost"));
  if (!effective_from || !(cost >= 0)) done("error", "Enter a valid date and cost.");
  const { error } = await supabase
    .from("rain_suit_costs")
    .upsert({ effective_from, cost }, { onConflict: "effective_from" });
  revalidatePath(BACK);
  if (error) done("error", error.message);
  done("ok", "Cost saved. It applies to entries dated from that day onward; older entries are unchanged.");
}

export async function addLedger(formData: FormData) {
  const { supabase } = await requireRole("admin");
  const kind = String(formData.get("kind"));
  const partner = kind === "profit_taken" ? String(formData.get("partner") || "") : null;
  const amount = Number(formData.get("amount"));
  const entry_date = String(formData.get("entry_date") || "");
  const note = String(formData.get("note") || "").trim() || null;
  if (!["profit_taken", "spending"].includes(kind) || !(amount > 0) || !entry_date) {
    done("error", "Enter a valid date and amount.");
  }
  if (kind === "profit_taken" && !["khan_zaib", "hafeez"].includes(partner ?? "")) {
    done("error", "Choose a partner.");
  }
  const { error } = await supabase
    .from("rain_suit_ledger")
    .insert({ kind, partner, amount, entry_date, note });
  revalidatePath(BACK);
  if (error) done("error", error.message);
  done("ok", "Saved.");
}

export async function deleteLedger(formData: FormData) {
  const { supabase } = await requireRole("admin");
  const { error } = await supabase.from("rain_suit_ledger").delete().eq("id", String(formData.get("id")));
  revalidatePath(BACK);
  done(error ? "error" : "ok", error ? error.message : "Deleted.");
}
