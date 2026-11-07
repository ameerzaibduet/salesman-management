import Link from "next/link";
import { requireRole } from "@/lib/session";
import { money } from "@/lib/format";
import { Card } from "@/components/Shell";

export default async function DuesPage() {
  const { supabase } = await requireRole("admin");
  const { data } = await supabase
    .from("salesman_balances")
    .select("*")
    .order("balance", { ascending: false });
  const rows = (data ?? []) as any[];
  const sum = (k: string) => rows.reduce((a, r) => a + Number(r[k]), 0);
  const total = sum("balance");

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="Total taken" value={money(sum("total_sales"))} />
        <Card label="Total returned" value={money(sum("total_returns"))} />
        <Card label="Total paid" value={money(sum("total_payments"))} tone="green" />
        <Card label="Total dues" value={money(total)} tone={total > 0 ? "red" : "green"} />
      </div>

      <section className="overflow-x-auto rounded-xl border bg-white">
        <h3 className="border-b p-3 font-semibold">Dues by salesman — click a name to see full history</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-2">Salesman</th>
              <th className="p-2 text-right">Taken</th>
              <th className="p-2 text-right">Returned</th>
              <th className="p-2 text-right">Paid</th>
              <th className="p-2 text-right">Dues</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-gray-400">No salesmen yet</td></tr>
            )}
            {rows.map((r) => {
              const bal = Number(r.balance);
              return (
                <tr key={r.salesman_id} className="border-t hover:bg-gray-50">
                  <td className="p-2">
                    <Link href={`/admin/accounts/${r.salesman_id}`} className="font-medium text-blue-600 hover:underline">
                      {r.full_name || r.username}
                    </Link>
                    {!r.is_active && <span className="ml-2 text-xs text-gray-400">(disabled)</span>}
                  </td>
                  <td className="p-2 text-right">{money(r.total_sales)}</td>
                  <td className="p-2 text-right">{money(r.total_returns)}</td>
                  <td className="p-2 text-right">{money(r.total_payments)}</td>
                  <td className={`p-2 text-right font-semibold ${bal > 0 ? "text-red-600" : "text-green-600"}`}>
                    {bal < 0 ? `${money(Math.abs(bal))} advance` : money(bal)}
                  </td>
                  <td className="p-2 text-right">
                    <Link href={`/admin/accounts/${r.salesman_id}`} className="rounded border px-2 py-1">
                      View history
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="border-t bg-gray-50 font-semibold">
              <tr>
                <td className="p-2">Total</td>
                <td className="p-2 text-right">{money(sum("total_sales"))}</td>
                <td className="p-2 text-right">{money(sum("total_returns"))}</td>
                <td className="p-2 text-right">{money(sum("total_payments"))}</td>
                <td className="p-2 text-right">{money(total)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </section>
    </>
  );
}
