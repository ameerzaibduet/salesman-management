import Link from "next/link";
import { requireRole } from "@/lib/session";
import { money, today, type SP } from "@/lib/format";
import { Card, Flash } from "@/components/Shell";
import { addLedger, deleteLedger, setCost } from "./actions";

const NAMES: Record<string, string> = { khan_zaib: "Khan Zaib", hafeez: "Hafeez" };

export default async function RainSuitsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { supabase } = await requireRole("admin");
  const t = today();

  const [rep, costs, ledger] = await Promise.all([
    supabase.rpc("rain_suit_report"),
    supabase.from("rain_suit_costs").select("*").order("effective_from", { ascending: false }),
    supabase.from("rain_suit_ledger").select("*").order("entry_date", { ascending: false }).order("created_at", { ascending: false }),
  ]);
  const rows = ((rep.data ?? []) as any[]).map((r) => ({
    id: r.salesman_id as string,
    name: r.full_name as string,
    takenQty: Number(r.taken_qty),
    takenAmt: Number(r.taken_amount),
    retQty: Number(r.returned_qty),
    retAmt: Number(r.returned_amount),
    costNet: Number(r.cost_taken) - Number(r.cost_returned),
  }));
  const costRows = (costs.data ?? []) as any[];
  const entries = (ledger.data ?? []) as any[];

  const sum = (f: (r: (typeof rows)[number]) => number) => rows.reduce((a, r) => a + f(r), 0);
  const netQty = sum((r) => r.takenQty - r.retQty);
  const netSales = sum((r) => r.takenAmt - r.retAmt);
  const costNet = sum((r) => r.costNet);
  const gross = netSales - costNet;
  const spendings = entries.filter((e) => e.kind === "spending").reduce((a, e) => a + Number(e.amount), 0);
  const net = gross; // spendings are already inside the per-unit cost, so they are not deducted again
  const share = net / 2;
  const takenBy = (p: string) =>
    entries.filter((e) => e.kind === "profit_taken" && e.partner === p).reduce((a, e) => a + Number(e.amount), 0);
  const totalTaken = takenBy("khan_zaib") + takenBy("hafeez");
  const inHand = net - totalTaken;

  const currentCost = costRows.find((c) => c.effective_from <= t) ?? costRows[costRows.length - 1];
  const input = "w-full rounded-lg border p-2";

  return (
    <>
      <Flash sp={sp} />
      <h2 className="text-xl font-bold">Rain Suits — partner profit (50 / 50)</h2>
      {costRows.length === 0 && (
        <p className="rounded bg-yellow-50 p-3 text-sm text-yellow-800">
          Set the cost price below first. Until then profit shows as the full sale amount.
        </p>
      )}
      <p className="text-xs text-gray-500">
        Based on approved Rain Suit entries only. Profit = sales − returns − cost (spendings are assumed to be inside the
        per-unit cost, so they are only recorded, not deducted), counted when the
        sale is approved (whether or not the salesman has paid yet). Rain Suit entries are also part of each
        salesman&apos;s normal account.
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="Net suits (taken − returned)" value={String(netQty)} />
        <Card label="Net sales" value={money(netSales)} />
        <Card label="Cost of net suits" value={money(costNet)} />
        <Card label="Gross profit" value={money(gross)} />
        <Card label="Spendings (record only)" value={money(spendings)} />
        <Card label="Profit to share" value={money(net)} tone={net >= 0 ? "green" : "red"} />
        <Card label="Profit taken so far" value={money(totalTaken)} />
        <Card label="Remaining in my hand" value={money(inHand)} tone={inHand >= 0 ? "green" : "red"} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {(["khan_zaib", "hafeez"] as const).map((p) => (
          <div key={p} className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold">{NAMES[p]} — 50% share</h3>
            <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
              <div><dt className="text-gray-500">Share</dt><dd className="font-bold">{money(share)}</dd></div>
              <div><dt className="text-gray-500">Taken</dt><dd className="font-bold">{money(takenBy(p))}</dd></div>
              <div>
                <dt className="text-gray-500">Remaining</dt>
                <dd className={`font-bold ${share - takenBy(p) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {money(share - takenBy(p))}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <form action={setCost} className="space-y-3 rounded-xl border bg-white p-4">
          <h3 className="font-semibold">Cost price per suit</h3>
          <p className="text-sm text-gray-500">
            Current: <b>{currentCost ? money(currentCost.cost) : "not set"}</b>. A new cost only applies to
            entries dated from the chosen day onward.
          </p>
          <label className="block text-sm">Cost (Rs.)<input name="cost" type="number" step="0.01" min="0" required className={input} /></label>
          <label className="block text-sm">Effective from<input name="effective_from" type="date" defaultValue={t} required className={input} /></label>
          <button className="rounded-lg bg-black px-4 py-2 text-white">Save cost</button>
          {costRows.length > 0 && (
            <ul className="border-t pt-2 text-xs text-gray-600">
              {costRows.map((c) => (
                <li key={c.id}>{c.effective_from}: {money(c.cost)}</li>
              ))}
            </ul>
          )}
        </form>

        <form action={addLedger} className="space-y-3 rounded-xl border bg-white p-4">
          <h3 className="font-semibold">Profit taken by partner</h3>
          <input type="hidden" name="kind" value="profit_taken" />
          <label className="block text-sm">Partner
            <select name="partner" required className={input}>
              <option value="khan_zaib">Khan Zaib</option>
              <option value="hafeez">Hafeez</option>
            </select>
          </label>
          <label className="block text-sm">Amount (Rs.)<input name="amount" type="number" step="0.01" min="0.01" required className={input} /></label>
          <label className="block text-sm">Date<input name="entry_date" type="date" defaultValue={t} required className={input} /></label>
          <label className="block text-sm">Note<input name="note" className={input} /></label>
          <button className="rounded-lg bg-black px-4 py-2 text-white">Save</button>
        </form>

        <form action={addLedger} className="space-y-3 rounded-xl border bg-white p-4">
          <h3 className="font-semibold">Add spending (record only)</h3>
          <input type="hidden" name="kind" value="spending" />
          <label className="block text-sm">Amount (Rs.)<input name="amount" type="number" step="0.01" min="0.01" required className={input} /></label>
          <label className="block text-sm">Date<input name="entry_date" type="date" defaultValue={t} required className={input} /></label>
          <label className="block text-sm">What for<input name="note" className={input} /></label>
          <button className="rounded-lg bg-black px-4 py-2 text-white">Save</button>
        </form>
      </div>

      <section className="overflow-x-auto rounded-xl border bg-white">
        <h3 className="border-b p-3 font-semibold">Rain Suits by salesman</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-2">Salesman</th>
              <th className="p-2 text-right">Taken</th>
              <th className="p-2 text-right">Returned</th>
              <th className="p-2 text-right">Net qty</th>
              <th className="p-2 text-right">Net sales</th>
              <th className="p-2 text-right">Cost</th>
              <th className="p-2 text-right">Profit</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} className="p-4 text-center text-gray-400">No approved Rain Suit entries yet</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">
                  <Link href={`/admin/accounts/${r.id}`} className="text-blue-600 hover:underline">{r.name}</Link>
                </td>
                <td className="p-2 text-right">{r.takenQty} ({money(r.takenAmt)})</td>
                <td className="p-2 text-right">{r.retQty} ({money(r.retAmt)})</td>
                <td className="p-2 text-right">{r.takenQty - r.retQty}</td>
                <td className="p-2 text-right">{money(r.takenAmt - r.retAmt)}</td>
                <td className="p-2 text-right">{money(r.costNet)}</td>
                <td className="p-2 text-right font-medium">{money(r.takenAmt - r.retAmt - r.costNet)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="overflow-x-auto rounded-xl border bg-white">
        <h3 className="border-b p-3 font-semibold">Profit withdrawals and spendings</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="p-2">Date</th><th className="p-2">Type</th><th className="p-2">Note</th><th className="p-2 text-right">Amount</th><th className="p-2" /></tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-400">Nothing recorded</td></tr>
            )}
            {entries.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-2 whitespace-nowrap">{e.entry_date}</td>
                <td className="p-2">{e.kind === "spending" ? "Spending" : `Profit taken — ${NAMES[e.partner]}`}</td>
                <td className="p-2">{e.note}</td>
                <td className="p-2 text-right font-medium">{money(e.amount)}</td>
                <td className="p-2 text-right">
                  <form action={deleteLedger}>
                    <input type="hidden" name="id" value={e.id} />
                    <button className="text-red-600">Delete</button>
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
