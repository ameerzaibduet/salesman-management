"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { TABLES, isTxType } from "@/lib/format";

function safeBack(v: FormDataEntryValue | null) {
  const s = String(v ?? "");
  return s.startsWith("/") && !s.startsWith("//") ? s.split("?")[0] : "/";
}

function flash(back: string, key: "ok" | "error", msg: string) {
  return `${back}?${key}=${encodeURIComponent(msg)}`;
}

function buildRow(type: "sale" | "return" | "payment", f: FormData) {
  const note = String(f.get("note") || "").trim() || null;
  if (type === "payment") {
    return {
      payment_date: String(f.get("date") || ""),
      amount: Number(f.get("amount")),
      payment_method: String(f.get("payment_method") || "cash"),
      reference: String(f.get("reference") || "").trim() || null,
      note,
    };
  }
  return {
    entry_date: String(f.get("date") || ""),
    product_name: String(f.get("product_name") || "").trim(),
    quantity: Number(f.get("quantity")),
    unit_price: Number(f.get("unit_price")),
    note,
  };
}

/** Salesman: insert (always pending, enforced by DB). Admin: insert on behalf (auto-approved) or update. */
export async function saveTransaction(formData: FormData) {
  const { supabase, user, profile } = await requireUser();
  const back = safeBack(formData.get("back"));
  const type = String(formData.get("type") || "");
  if (!isTxType(type)) redirect(flash(back, "error", "Invalid type"));
  const table = TABLES[type];
  const id = String(formData.get("id") || "");
  const row = buildRow(type, formData);

  if (type !== "payment" && !(row as { product_name: string }).product_name) {
    redirect(flash(back, "error", "Product is required"));
  }

  let error: { message: string } | null = null;

  if (id) {
    if (profile.role !== "admin") redirect(flash(back, "error", "Not allowed"));
    ({ error } = await supabase.from(table).update(row).eq("id", id));
  } else if (profile.role === "admin") {
    const salesman_id = String(formData.get("salesman_id") || "");
    if (!salesman_id) redirect(flash(back, "error", "Salesman missing"));
    ({ error } = await supabase.from(table).insert({
      ...row,
      salesman_id,
      status: "approved",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    }));
  } else {
    ({ error } = await supabase.from(table).insert({ ...row, salesman_id: user.id }));
  }

  revalidatePath("/", "layout");
  if (error) redirect(flash(back, "error", error.message));
  redirect(
    flash(
      back,
      "ok",
      profile.role === "admin" || id ? "Saved." : "Submitted. Waiting for admin approval."
    )
  );
}

export async function deleteTransaction(formData: FormData) {
  const { supabase, profile } = await requireUser();
  const back = safeBack(formData.get("back"));
  const type = String(formData.get("type") || "");
  if (profile.role !== "admin" || !isTxType(type)) redirect(flash(back, "error", "Not allowed"));
  const { error } = await supabase
    .from(TABLES[type])
    .delete()
    .eq("id", String(formData.get("id") || ""));
  revalidatePath("/", "layout");
  redirect(error ? flash(back, "error", error.message) : flash(back, "ok", "Deleted."));
}

export async function reviewTransaction(formData: FormData) {
  const { supabase, profile } = await requireUser();
  const back = safeBack(formData.get("back"));
  if (profile.role !== "admin") redirect(flash(back, "error", "Not allowed"));
  const { error } = await supabase.rpc("review_transaction", {
    p_transaction_type: String(formData.get("type")),
    p_transaction_id: String(formData.get("id")),
    p_decision: String(formData.get("decision")),
    p_reason: String(formData.get("reason") || "") || null,
  });
  revalidatePath("/", "layout");
  redirect(error ? flash(back, "error", error.message) : flash(back, "ok", "Done."));
}
