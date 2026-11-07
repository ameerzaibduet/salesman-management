import { requireRole } from "@/lib/session";
import { resolveRange, today, type SP } from "@/lib/format";
import { TransactionForm } from "@/components/TransactionForm";
import { RangeFilter } from "@/components/RangeFilter";
import { Ledger } from "@/components/Ledger";
import { Flash } from "@/components/Shell";

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { supabase, user } = await requireRole("salesman");
  // History pages show everything by default; the filter narrows it.
  const range = resolveRange({ from: "2000-01-01", to: "2999-12-31", ...sp });
  const path = "/salesman/payments";
  return (
    <>
      <Flash sp={sp} />
      <TransactionForm type="payment" back={path} today={today()} />
      <RangeFilter path={path} from={range.from} to={range.to} />
      <Ledger supabase={supabase} salesmanId={user.id} path={path} sp={sp} range={range} types={["payment"]} columns={1} />
    </>
  );
}
