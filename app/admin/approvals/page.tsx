import Link from "next/link";
import { requireRole } from "@/lib/session";
import { TABLES, isTxType, money, one, type SP, type TxType } from "@/lib/format";
import { pendingCount } from "@/lib/data";
import { reviewTransaction } from "@/app/actions/transactions";
import { Flash } from "@/components/Shell";

const TABS: { type: TxType; label: string }[] = [
  { type: "sale", label: "Products Taken" },
  { type: "return", label: "Products Returned" },
  { type: "payment", label: "Payments" },
];

export default async function Approvals({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { supabase } = await requireRole("admin");
  const t = one(sp.tab) ?? "sale";
  const type: TxType = isTxType(t) ? t : "sale";
  const counts = await pendingCount(supabase);

  const { data } = await supabase
    .from(TABLES[type])
    .select("*, salesman:profiles!salesman_id(full_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(200);
  const rows = (data ?? []) as any[];
  const back = "/admin/approvals";

  return (
    <>
      <Flash sp={sp} />
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.type}
            href={`${back}?tab=${tab.type}`}
            className={`rounded-lg border px-3 py-1.5 text-sm ${tab.type === type ? "bg-black text-white" : "bg-white"}`}
          >
            {tab.label} ({counts[tab.type]})
          </Link>
        ))}
      </div>

      <section className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-2">Salesman</th>
              <th className="p-2">Date</th>
              <th className="p-2">Details</th>
              <th className="p-2 text-right">Total</th>
              <th className="p-2">Submitted</th>
              <th className="p-2">Decision</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-gray-400">Nothing pending</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="p-2">{r.salesman?.full_name}</td>
                <td className="p-2 whitespace-nowrap">{type === "payment" ? r.payment_date : r.entry_date}</td>
                <td className="p-2">
                  {type === "payment" ? (
                    <>
                      <span className="capitalize">{r.payment_method}</span>
                      {r.reference ? ` · ${r.reference}` : ""}
                    </>
                  ) : (
                    <>
                      {r.product_name} — {Number(r.quantity)} × {Number(r.unit_price).toLocaleString()}
                    </>
                  )}
                  {r.note && <div className="text-xs text-gray-500">{r.note}</div>}
                </td>
                <td className="p-2 text-right font-medium">{money(type === "payment" ? r.amount : r.total)}</td>
                <td className="p-2 whitespace-nowrap text-xs text-gray-500">
                  {new Date(r.created_at).toLocaleString("en-GB", { timeZone: "Asia/Karachi" })}
                </td>
                <td className="space-y-2 p-2">
                  <form action={reviewTransaction}>
                    <input type="hidden" name="type" value={type} />
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="decision" value="approved" />
                    <input type="hidden" name="back" value={`${back}?tab=${type}`} />
                    <button className="rounded bg-green-600 px-3 py-1 text-white">Approve</button>
                  </form>
                  <form action={reviewTransaction} className="flex gap-1">
                    <input type="hidden" name="type" value={type} />
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <input type="hidden" name="back" value={`${back}?tab=${type}`} />
                    <input name="reason" required placeholder="Reason" className="w-32 rounded border p-1" />
                    <button className="rounded bg-red-600 px-3 py-1 text-white">Reject</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
