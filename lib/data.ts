import type { SupabaseClient } from "@supabase/supabase-js";

export async function getBalance(supabase: SupabaseClient, salesmanId: string) {
  const { data } = await supabase
    .from("salesman_balances")
    .select("*")
    .eq("salesman_id", salesmanId)
    .maybeSingle();
  return {
    total_sales: Number(data?.total_sales ?? 0),
    total_returns: Number(data?.total_returns ?? 0),
    total_payments: Number(data?.total_payments ?? 0),
    balance: Number(data?.balance ?? 0),
  };
}

export async function pendingCount(supabase: SupabaseClient, salesmanId?: string) {
  const counts = await Promise.all(
    ["sales", "returns", "payments"].map(async (t) => {
      let q = supabase.from(t).select("id", { count: "exact", head: true }).eq("status", "pending");
      if (salesmanId) q = q.eq("salesman_id", salesmanId);
      const { count } = await q;
      return count ?? 0;
    })
  );
  return { sale: counts[0], return: counts[1], payment: counts[2], total: counts[0] + counts[1] + counts[2] };
}

export async function productNames(supabase: SupabaseClient) {
  const { data } = await supabase.from("products").select("name").eq("is_active", true).order("name");
  return (data ?? []).map((p) => p.name as string);
}
