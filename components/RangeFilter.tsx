import Link from "next/link";
import { today } from "@/lib/format";

function monthStart(t: string) {
  return t.slice(0, 8) + "01";
}

export function RangeFilter({
  path,
  from,
  to,
}: {
  path: string;
  from: string;
  to: string;
}) {
  const t = today();
  const d30 = new Date(t);
  d30.setDate(d30.getDate() - 29);
  const last30 = d30.toISOString().slice(0, 10);
  return (
    <form method="get" action={path} className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-3 text-sm">
      <label>
        From
        <input type="date" name="from" defaultValue={from} className="ml-2 rounded border p-1.5" />
      </label>
      <label>
        To
        <input type="date" name="to" defaultValue={to} className="ml-2 rounded border p-1.5" />
      </label>
      <button className="rounded bg-black px-3 py-1.5 text-white">Apply</button>
      <Link href={`${path}?from=${monthStart(t)}&to=${t}`} className="rounded border px-3 py-1.5">
        This month
      </Link>
      <Link href={`${path}?from=${last30}&to=${t}`} className="rounded border px-3 py-1.5">
        Last 30 days
      </Link>
    </form>
  );
}
