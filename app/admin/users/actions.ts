"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

function back(key: "ok" | "error", msg: string) {
  return `/admin/users?${key}=${encodeURIComponent(msg)}`;
}

export async function createSalesman(formData: FormData) {
  await requireRole("admin");

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const full_name = String(formData.get("full_name") || "").trim();
  const username = String(formData.get("username") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const address = String(formData.get("address") || "").trim();

  if (!email || !full_name || password.length < 10) {
    redirect(back("error", "Name, email and a password of at least 10 characters are required."));
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, username, phone, address },
  });
  if (error) redirect(back("error", error.message));

  revalidatePath("/admin/users");
  redirect(back("ok", "Salesman account created."));
}

export async function setActive(formData: FormData) {
  const { supabase, user } = await requireRole("admin");
  const id = String(formData.get("id"));
  const active = String(formData.get("active")) === "true";
  if (id === user.id) redirect(back("error", "You cannot disable your own account."));

  const { error } = await supabase.from("profiles").update({ is_active: active }).eq("id", id);
  revalidatePath("/admin/users");
  redirect(error ? back("error", error.message) : back("ok", active ? "Account enabled." : "Account disabled."));
}

export async function resetPassword(formData: FormData) {
  await requireRole("admin");
  const id = String(formData.get("id"));
  const password = String(formData.get("password") || "");
  if (password.length < 10) redirect(back("error", "Password must be at least 10 characters."));

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, { password });
  redirect(error ? back("error", error.message) : back("ok", "Password updated."));
}
