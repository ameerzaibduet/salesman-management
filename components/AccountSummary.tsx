import type { SupabaseClient } from "@supabase/supabase-js";
import { money } from "@/lib/format";
import { Card } from "@/components/Shell";
import { ActivityChart, type DayPoint } from "@/components/ActivityChart";

/**
 * Period totals + chart for one salesman (or all salesmen when salesmanId is null).
 * All numbers are APPROVED transactions only. "Outstanding" is the all-time balance.
 */
export async function AccountSummary({
  supabase,
  salesmanId,
  range,
  outstanding,
  pending,
}: {
  supabase: SupabaseClient;
  salesmanId: string | null;
  range: { from: string; to: string };
  outstanding: number;
  pending?: number;
}) {
  const { data } = await supabase.rpc("daily_totals", {
    p_salesman: salesmanId,
    p_from: range.from,
    p_to: range.to,
  });

  const points: DayPoint[] = ((data ?? []) as any[]).map((d) => ({
    day: d.day,
    taken: Number(d.taken),
    returned: Number(d.returned),
    paid: Number(d.paid),
  }));
  const sum = (k: "taken" | "returned" | "paid") => points.reduce((a, p) => a + p[k], 0);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card label="Products taken (period)" value={money(sum("taken"))} />
        <Card label="Returned (period)" value={money(sum("returned"))} />
        <Card label="Payments (period)" value={money(sum("paid"))} tone="green" />
        <Card
          label={outstanding < 0 ? "Advance / credit (all time)" : "Outstanding dues (all time)"}
          value={money(Math.abs(outstanding))}
          tone={outstanding > 0 ? "red" : "green"}
        />
        {pending !== undefined && <Card label="Pending approval" value={String(pending)} />}
      </div>
      <ActivityChart data={points} />
    </>
  );
}
