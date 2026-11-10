import Link from "next/link";
import { requireRole } from "@/lib/session";
import { one, today, type SP } from "@/lib/format";
import { Flash } from "@/components/Shell";
import { dayLabel, isOpen, type MissedRow } from "@/components/MissedAlert";
import { ignoreDay, ignoreRange, reviewSkip, undoSkip } from "./actions";

export default async function AdminMissedPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { supabase } = await requireRole("admin");
  const only = one(sp.salesman);
  const back = only ? `/admin/missed?salesman=${only}` : "/admin/missed";

  let ignoredQ = supabase
    .from("day_skips")
    .select("id, skip_date, reason, salesman:profiles!salesman_id(full_name)")
    .eq("status", "approved")
    .order("skip_date", { ascending: false })
    .limit(100);
  if (only) ignoredQ = ignoredQ.eq("salesman_id", only);

  const [{ data: missedData }, { data: salesmen }, { data: ignored }] = await Promise.all([
    supabase.rpc("missed_days", only ? { p_salesman: only } : {}),
    supabase.from("profiles").select("id, full_name").eq("role", "salesman").eq("is_active", true).order("full_name"),
    ignoredQ,
  ]);

  const all = (missedData ?? []) as MissedRow[];
  const waiting = all.filter((r) => !isOpen(r)).sort((a, b) => a.missed_date.localeCompare(b.missed_date));
  const openRows = all.filter(isOpen);

  const groups = new Map<string, { name: string; rows: MissedRow[] }>();
  for (const r of openRows) {
    const g = groups.get(r.salesman_id) ?? { name: r.full_name, rows: [] };
    g.rows.push(r);
    groups.set(r.salesman_id, g);
  }
  const list = [...groups.entries()].sort((a, b) => b[1].rows.length - a[1].rows.length);
  const input = "w-full rounded-lg border p-2";
  const t = today();

  return (
    <>
      <Flash sp={sp} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">
          Missed entries — {openRows.length} day{openRows.length === 1 ? "" : "s"}
          {only ? "" : ` · ${list.length} salesm${list.length === 1 ? "an" : "en"}`}
        </h2>
        <div className="space-x-3 text-sm">
          {only && <Link href="/admin/missed" className="text-blue-600">Show all salesmen</Link>}
          <Link href="/admin/off-days" className="rounded border px-3 py-1.5">Off days / holidays</Link>
        </div>
      </div>
      <p className="text-sm text-gray-500">
        Checking starts from each salesman&apos;s first entry, runs up to yesterday, and skips off days. Today is never counted.
      </p>

      {waiting.length > 0 && (
        <section className="overflow-x-auto rounded-xl border border-yellow-300 bg-white">
          <h3 className="border-b bg-yellow-50 p-3 font-semibold">Skip requests waiting for you ({waiting.length})</h3>
          <table className="w-full text-sm">
            <tbody>
              {waiting.map((r) => (
                <tr key={r.salesman_id + r.missed_date} className="border-t align-top">
                  <td className="p-2 font-medium">{r.full_name}</td>
                  <td className="p-2 whitespace-nowrap">{dayLabel(r.missed_date)}</td>
                  <td className="p-2">“{r.skip_reason}”</td>
                  <td className="space-y-2 p-2">
                    <form action={ignoreDay}>
                      <input type="hidden" name="salesman_id" value={r.salesman_id} />
                      <input type="hidden" name="date" value={r.missed_date} />
                      <input type="hidden" name="reason" value={r.skip_reason ?? ""} />
                      <input type="hidden" name="back" value={back} />
                      <button className="rounded bg-green-600 px-3 py-1 text-white">Approve</button>
                    </form>
                    <RejectForm salesmanId={r.salesman_id} date={r.missed_date} back={back} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <form action={ignoreRange} className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-4">
        <h3 className="font-semibold sm:col-span-4">Ignore days for a salesman (absent, on leave, etc.)</h3>
        <input type="hidden" name="back" value={back} />
        <label className="text-sm">Salesman
          <select name="salesman_id" required defaultValue={only ?? ""} className={input}>
            <option value="" disabled>Select</option>
            {(salesmen ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
        </label>
        <label className="text-sm">From<input type="date" name="from" defaultValue={t} required className={input} /></label>
        <label className="text-sm">To<input type="date" name="to" defaultValue={t} required className={input} /></label>
        <label className="text-sm">Reason (optional)<input name="reason" className={input} /></label>
        <div className="sm:col-span-4"><button className="rounded-lg bg-black px-4 py-2 text-white">Ignore these days</button></div>
      </form>

      {list.length === 0 && (
        <p className="rounded-xl border bg-white p-6 text-center text-green-600">No missed days.</p>
      )}

      {list.map(([id, g]) => (
        <section key={id} className="rounded-xl border bg-white">
          <div className="flex items-center justify-between border-b p-3">
            <h3 className="font-semibold">
              {g.name} <span className="text-sm font-normal text-red-600">({g.rows.length} days)</span>
            </h3>
            <Link href={`/admin/accounts/${id}`} className="text-sm text-blue-600">Open account →</Link>
          </div>
          <ul className="flex flex-wrap gap-2 p-3 text-sm">
            {g.rows
              .slice()
              .sort((a, b) => b.missed_date.localeCompare(a.missed_date))
              .map((r) => (
                <li key={r.missed_date}>
                  <form action={ignoreDay}>
                    <input type="hidden" name="salesman_id" value={id} />
                    <input type="hidden" name="date" value={r.missed_date} />
                    <input type="hidden" name="back" value={back} />
                    <button
                      title="Ignore this day for this salesman"
                      className="rounded-full bg-red-50 px-3 py-1 text-red-700 hover:bg-red-100"
                    >
                      {dayLabel(r.missed_date)} ✕
                      {r.skip_status === "rejected" ? " (skip rejected)" : ""}
                    </button>
                  </form>
                </li>
              ))}
          </ul>
          <p className="px-3 pb-3 text-xs text-gray-400">Tap a date to ignore it for this salesman.</p>
        </section>
      ))}

      <section className="overflow-x-auto rounded-xl border bg-white">
        <h3 className="border-b p-3 font-semibold">Ignored / approved skip days (latest 100)</h3>
        <table className="w-full text-sm">
          <tbody>
            {(ignored ?? []).length === 0 && (
              <tr><td className="p-4 text-center text-gray-400">None</td></tr>
            )}
            {(ignored ?? []).map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.salesman?.full_name}</td>
                <td className="p-2 whitespace-nowrap">{dayLabel(r.skip_date)}</td>
                <td className="p-2 text-gray-500">{r.reason}</td>
                <td className="p-2 text-right">
                  <form action={undoSkip}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="back" value={back} />
                    <button className="text-red-600">Undo</button>
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

function RejectForm({ salesmanId, date, back }: { salesmanId: string; date: string; back: string }) {
  return (
    <form action={rejectAction} className="flex gap-1">
      <input type="hidden" name="id" value={`${salesmanId}|${date}`} />
      <input type="hidden" name="decision" value="rejected" />
      <input type="hidden" name="back" value={back} />
      <input name="reason" required placeholder="Reason" className="w-28 rounded border p-1" />
      <button className="rounded bg-red-600 px-3 py-1 text-white">Reject</button>
    </form>
  );
}

async function rejectAction(formData: FormData) {
  "use server";
  // The waiting list is keyed by salesman + date; look up the row id, then reuse reviewSkip.
  const { supabase } = await requireRole("admin");
  const [salesmanId, date] = String(formData.get("id")).split("|");
  const { data } = await supabase
    .from("day_skips")
    .select("id")
    .eq("salesman_id", salesmanId)
    .eq("skip_date", date)
    .eq("status", "pending")
    .maybeSingle();
  formData.set("id", data?.id ?? "");
  await reviewSkip(formData);
}
