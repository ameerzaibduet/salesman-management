import { requireRole } from "@/lib/session";
import { today, type SP } from "@/lib/format";
import { Flash } from "@/components/Shell";
import { dayLabel } from "@/components/MissedAlert";
import { addIgnoredDay, removeIgnoredDay, saveWeekdays } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function OffDaysPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { supabase } = await requireRole("admin");
  const [{ data: cfg }, { data: ignored }] = await Promise.all([
    supabase.from("alert_settings").select("off_weekdays").maybeSingle(),
    supabase.from("ignored_days").select("*").order("day", { ascending: false }),
  ]);
  const off: number[] = cfg?.off_weekdays ?? [0];
  const input = "w-full rounded-lg border p-2";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Flash sp={sp} />
      <h2 className="text-xl font-bold">Off days for missed-entry alerts</h2>

      <form action={saveWeekdays} className="space-y-3 rounded-xl border bg-white p-4">
        <h3 className="font-semibold">Weekly off days</h3>
        <p className="text-sm text-gray-500">Ticked weekdays are never counted as missed.</p>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          {DAYS.map((d, i) => (
            <label key={d} className="flex items-center gap-2">
              <input type="checkbox" name="off" value={i} defaultChecked={off.includes(i)} /> {d}
            </label>
          ))}
        </div>
        <SubmitButton className="rounded-lg bg-black px-4 py-2 text-white">Save</SubmitButton>
      </form>

      <form action={addIgnoredDay} className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-3">
        <h3 className="font-semibold sm:col-span-3">Ignore a specific date (holiday, Eid, etc.)</h3>
        <label className="text-sm">Date<input type="date" name="day" defaultValue={today()} required className={input} /></label>
        <label className="text-sm sm:col-span-2">Note (optional)<input name="note" className={input} /></label>
        <div className="sm:col-span-3"><SubmitButton className="rounded-lg bg-black px-4 py-2 text-white">Ignore this day</SubmitButton></div>
      </form>

      <section className="rounded-xl border bg-white">
        <h3 className="border-b p-3 font-semibold">Ignored dates</h3>
        {(ignored ?? []).length === 0 && <p className="p-4 text-center text-sm text-gray-400">None</p>}
        {(ignored ?? []).map((r: any) => (
          <form key={r.day} action={removeIgnoredDay} className="flex items-center justify-between border-b p-3 text-sm last:border-0">
            <span>{dayLabel(r.day)}{r.note ? ` — ${r.note}` : ""}</span>
            <input type="hidden" name="day" value={r.day} />
            <SubmitButton className="text-red-600">Remove</SubmitButton>
          </form>
        ))}
      </section>
    </div>
  );
}
