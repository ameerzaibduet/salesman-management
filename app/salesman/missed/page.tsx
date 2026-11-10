import Link from "next/link";
import { requireRole } from "@/lib/session";
import type { SP } from "@/lib/format";
import { Flash } from "@/components/Shell";
import { dayLabel, type MissedRow } from "@/components/MissedAlert";
import { requestSkip } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function MissedPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { supabase, user } = await requireRole("salesman");
  const { data } = await supabase.rpc("missed_days", { p_salesman: user.id });
  const rows = ((data ?? []) as MissedRow[]).slice().sort((a, b) => b.missed_date.localeCompare(a.missed_date));
  const open = rows.filter((r) => r.skip_status !== "pending").length;

  return (
    <>
      <Flash sp={sp} />
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Days with no entry ({open})</h2>
        <Link href="/salesman/dashboard" className="text-sm text-blue-600">← Dashboard</Link>
      </div>
      <p className="text-sm text-gray-500">
        Add the missing entries using the matching date on the forms, or skip the day with a reason and the admin
        will confirm it. Sundays and holidays set by the admin are not counted.
      </p>

      <section className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="p-2">Date</th><th className="p-2">Add entry</th><th className="p-2">Skip this day</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={3} className="p-4 text-center text-green-600">No missed days. Well done!</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.missed_date} className="border-t align-top">
                <td className="p-2 font-medium whitespace-nowrap">{dayLabel(r.missed_date)}</td>
                <td className="space-x-3 p-2 whitespace-nowrap">
                  <Link href="/salesman/sales" className="text-blue-600">Taken</Link>
                  <Link href="/salesman/returns" className="text-blue-600">Return</Link>
                  <Link href="/salesman/payments" className="text-blue-600">Payment</Link>
                </td>
                <td className="p-2">
                  {r.skip_status === "pending" ? (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                      Waiting for admin — “{r.skip_reason}”
                    </span>
                  ) : r.skip_status === "rejected" ? (
                    <span className="text-xs text-red-600">
                      Skip rejected{r.skip_rejection ? `: ${r.skip_rejection}` : ""}. Please add the entry.
                    </span>
                  ) : (
                    <form action={requestSkip} className="flex gap-1">
                      <input type="hidden" name="date" value={r.missed_date} />
                      <input name="reason" required minLength={3} placeholder="Reason" className="w-32 rounded border p-1 sm:w-48" />
                      <SubmitButton className="rounded border px-2 py-1">Skip</SubmitButton>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
