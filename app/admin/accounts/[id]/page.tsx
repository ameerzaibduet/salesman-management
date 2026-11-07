import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { resolveRange, today, money, type SP } from "@/lib/format";
import { getBalance, pendingCount, productNames } from "@/lib/data";
import { AccountSummary } from "@/components/AccountSummary";
import { RangeFilter } from "@/components/RangeFilter";
import { Ledger } from "@/components/Ledger";
import { TransactionForm } from "@/components/TransactionForm";
import { Card, Flash } from "@/components/Shell";

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SP>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { supabase } = await requireRole("admin");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", id).eq("role", "salesman").maybeSingle();
  if (!profile) notFound();

  const range = resolveRange(sp);
  const path = `/admin/accounts/${id}`;
  const [bal, pending, products] = await Promise.all([
    getBalance(supabase, id),
    pendingCount(supabase, id),
    productNames(supabase),
  ]);

  return (
    <>
      <Flash sp={sp} />
      <div className="rounded-xl border bg-white p-4">
        <h2 className="text-xl font-bold">{profile.full_name}</h2>
        <p className="text-sm text-gray-500">
          {[profile.username && `@${profile.username}`, profile.email, profile.phone].filter(Boolean).join(" · ")}
          {!profile.is_active && " · DISABLED"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="Total taken" value={money(bal.total_sales)} />
        <Card label="Total returned" value={money(bal.total_returns)} />
        <Card label="Total paid" value={money(bal.total_payments)} tone="green" />
        <Card label={bal.balance < 0 ? "Advance / credit" : "Remaining dues"} value={money(Math.abs(bal.balance))} tone={bal.balance > 0 ? "red" : "green"} />
      </div>

      <RangeFilter path={path} from={range.from} to={range.to} />
      <AccountSummary supabase={supabase} salesmanId={id} range={range} outstanding={bal.balance} pending={pending.total} />

      <details className="rounded-xl border bg-white p-3">
        <summary className="cursor-pointer font-semibold">Add entry on behalf of this salesman (saved as approved)</summary>
        <div className="mt-3 grid gap-3 xl:grid-cols-3">
          <TransactionForm type="sale" back={path} today={today()} products={products} salesmanId={id} />
          <TransactionForm type="return" back={path} today={today()} products={products} salesmanId={id} />
          <TransactionForm type="payment" back={path} today={today()} salesmanId={id} />
        </div>
      </details>

      <Ledger supabase={supabase} salesmanId={id} path={path} sp={sp} range={range} admin />
    </>
  );
}
