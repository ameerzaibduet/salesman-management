"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";

export async function addProduct(formData: FormData) {
  const { supabase } = await requireRole("admin");
  const name = String(formData.get("name") || "").trim();
  if (!name) redirect("/admin/products?error=Name%20required");
  const { error } = await supabase.from("products").insert({ name });
  revalidatePath("/admin/products");
  redirect(error ? `/admin/products?error=${encodeURIComponent(error.message)}` : "/admin/products?ok=Added");
}

export async function toggleProduct(formData: FormData) {
  const { supabase } = await requireRole("admin");
  await supabase
    .from("products")
    .update({ is_active: String(formData.get("active")) === "true" })
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin/products");
  redirect("/admin/products");
}
