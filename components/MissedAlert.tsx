import Link from "next/link";

export type MissedRow = {
  salesman_id: string;
  full_name: string;
  missed_date: string;
  skip_status?: "pending" | "rejected" | null;
  skip_reason?: string | null;
  skip_rejection?: string | null;
};

export function dayLabel(d: string) {
  return new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

const bar =
  "flex items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 hover:bg-red-100";

/** Days still needing attention (a pending skip request is waiting for the admin, so it is not nagged). */
export const isOpen = (r: MissedRow) => r.skip_status !== "pending";

/** One-line heading on the salesman dashboard. Click opens the full list. */
export function SalesmanMissedAlert({ rows }: { rows: MissedRow[] }) {
  const open = rows.filter(isOpen).length;
  if (open === 0) return null;
  return (
    <Link href="/salesman/missed" className={bar}>
      <span>⚠ You missed entries on {open} day{open > 1 ? "s" : ""}</span>
      <span className="whitespace-nowrap underline">View days →</span>
    </Link>
  );
}

/** One-line heading on the admin dashboard / account page. Click opens the full list. */
export function AdminMissedAlert({ rows, salesmanId }: { rows: MissedRow[]; salesmanId?: string }) {
  const openRows = rows.filter(isOpen);
  const open = openRows.length;
  const waiting = rows.length - open;
  if (open === 0 && waiting === 0) return null;
  const people = new Set(openRows.map((r) => r.salesman_id)).size;
  return (
    <Link href={salesmanId ? `/admin/missed?salesman=${salesmanId}` : "/admin/missed"} className={bar}>
      <span>
        ⚠ {open} missed day{open === 1 ? "" : "s"}
        {salesmanId || open === 0 ? "" : ` across ${people} salesm${people > 1 ? "en" : "an"}`}
        {waiting > 0 ? ` · ${waiting} skip request${waiting > 1 ? "s" : ""} to review` : ""}
      </span>
      <span className="whitespace-nowrap underline">View details →</span>
    </Link>
  );
}
