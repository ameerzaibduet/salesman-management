import Link from "next/link";
import { requireRole } from "@/lib/session";
import { money, resolveRange, type SP } from "@/lib/format";
import { pendingCount } from "@/lib/data";
import { AccountSummary } from "@/components/AccountSummary";
import { RangeFilter } from "@/components/RangeFilter";
import { Card, Flash } from "@/components/Shell";
import { AdminMissedAlert } from "@/components/MissedAlert";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { supabase } = await requireRole("admin");
  const range = resolveRange(sp);

  const [{ data }, pending] = await Promise.all([
    supabase.from("salesman_balances").select("*").order("balance", { ascending: false }),
    pendingCount(supabase),
  ]);
  const rows = (data ?? []) as any[];
  const sum = (k: string) => rows.reduce((a, r) => a + Number(r[k]), 0);
  const outstanding = sum("balance");
  const { data: missed } = await supabase.rpc("missed_days");

  return (
    <>
      <AdminMissedAlert rows={(missed ?? []) as any[]} />
      <Flash sp={sp} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card label="Total sales (all time)" value={money(sum("total_sales"))} />
        <Card label="Total returns" value={money(sum("total_returns"))} />
        <Card label="Total received" value={money(sum("total_payments"))} tone="green" />
        <Card label="Outstanding dues" value={money(outstanding)} tone={outstanding > 0 ? "red" : "green"} />
        <Link href="/admin/approvals">
          <Card label="Pending approvals" value={String(pending.total)} />
        </Link>
      </div>

      <RangeFilter path="/admin/dashboard" from={range.from} to={range.to} />
      <AccountSummary supabase={supabase} salesmanId={null} range={range} outstanding={outstanding} />

      <section className="overflow-x-auto rounded-xl border bg-white">
        <h3 className="border-b p-3 font-semibold">Dues by salesman</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-2">Salesman</th>
              <th className="p-2 text-right">Taken</th>
              <th className="p-2 text-right">Returned</th>
              <th className="p-2 text-right">Paid</th>
              <th className="p-2 text-right">Dues</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-400">No salesmen yet</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.salesman_id} className="border-t">
                <td className="p-2">
                  <Link href={`/admin/accounts/${r.salesman_id}`} className="text-blue-600 hover:underline">
                    {r.full_name || r.username}
                  </Link>
                  {!r.is_active && <span className="ml-2 text-xs text-gray-400">(disabled)</span>}
                </td>
                <td className="p-2 text-right">{money(r.total_sales)}</td>
                <td className="p-2 text-right">{money(r.total_returns)}</td>
                <td className="p-2 text-right">{money(r.total_payments)}</td>
                <td className={`p-2 text-right font-semibold ${Number(r.balance) > 0 ? "text-red-600" : "text-green-600"}`}>
                  {Number(r.balance) < 0 ? `${money(Math.abs(r.balance))} advance` : money(r.balance)}
                </td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="border-t bg-gray-50 font-semibold">
              <tr>
                <td className="p-2">Total</td>
                <td className="p-2 text-right">{money(sum("total_sales"))}</td>
                <td className="p-2 text-right">{money(sum("total_returns"))}</td>
                <td className="p-2 text-right">{money(sum("total_payments"))}</td>
                <td className="p-2 text-right">{money(outstanding)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </section>
    </>
  );
}
