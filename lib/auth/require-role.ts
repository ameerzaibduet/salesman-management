import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireRole(
  requiredRole: "admin" | "salesman"
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  if (profile.role !== requiredRole) {
    redirect(
      profile.role === "admin"
        ? "/admin/dashboard"
        : "/salesman/dashboard"
    );
  }

  return { supabase, user, profile };
}