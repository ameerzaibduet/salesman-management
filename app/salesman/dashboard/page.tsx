import { requireRole } from "@/lib/session";
import { resolveRange, type SP } from "@/lib/format";
import { getBalance, pendingCount } from "@/lib/data";
import { AccountSummary } from "@/components/AccountSummary";
import { RangeFilter } from "@/components/RangeFilter";
import { Ledger } from "@/components/Ledger";
import { Flash } from "@/components/Shell";
import { SalesmanMissedAlert } from "@/components/MissedAlert";

export default async function SalesmanDashboard({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { supabase, user } = await requireRole("salesman");
  const range = resolveRange(sp);
  const [bal, pending] = await Promise.all([getBalance(supabase, user.id), pendingCount(supabase, user.id)]);
  const { data: missed } = await supabase.rpc("missed_days", { p_salesman: user.id });
  const path = "/salesman/dashboard";

  return (
    <>
      <SalesmanMissedAlert rows={(missed ?? []) as any[]} />
      <Flash sp={sp} />
      <RangeFilter path={path} from={range.from} to={range.to} />
      <AccountSummary
        supabase={supabase}
        salesmanId={user.id}
        range={range}
        outstanding={bal.balance}
        pending={pending.total}
      />
      <Ledger supabase={supabase} salesmanId={user.id} path={path} sp={sp} range={range} />
    </>
  );
}
