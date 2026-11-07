import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  full_name: string;
  username: string | null;
  role: "admin" | "salesman";
  is_active: boolean;
};

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, username, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    redirect("/login?error=disabled");
  }
  return { supabase, user, profile: profile as Profile };
}

export async function requireRole(role: "admin" | "salesman") {
  const ctx = await requireUser();
  if (ctx.profile.role !== role) {
    redirect(ctx.profile.role === "admin" ? "/admin/dashboard" : "/salesman/dashboard");
  }
  return ctx;
}
