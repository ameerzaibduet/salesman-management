"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { today } from "@/lib/format";

function monthStart(t: string) {
  return t.slice(0, 8) + "01";
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-90" />
    </svg>
  );
}

export function RangeFilter({ path, from, to }: { path: string; from: string; to: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [which, setWhich] = useState<"apply" | "month" | "30" | null>(null);

  const go = (f: string, t: string, w: "apply" | "month" | "30") => {
    setWhich(w);
    startTransition(() => router.push(`${path}?from=${f}&to=${t}`));
  };

  const t = today();
  const d30 = new Date(t);
  d30.setDate(d30.getDate() - 29);
  const last30 = d30.toISOString().slice(0, 10);

  const btn =
    "inline-flex items-center justify-center gap-1.5 rounded px-3 py-1.5 disabled:cursor-wait disabled:opacity-60";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        go(String(fd.get("from") || from), String(fd.get("to") || to), "apply");
      }}
      className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-3 text-sm"
    >
      <label>
        From
        <input type="date" name="from" defaultValue={from} className="ml-2 rounded border p-1.5" />
      </label>
      <label>
        To
        <input type="date" name="to" defaultValue={to} className="ml-2 rounded border p-1.5" />
      </label>
      <button type="submit" disabled={pending} className={`${btn} bg-black text-white`}>
        {pending && which === "apply" && <Spinner />}Apply
      </button>
      <button type="button" disabled={pending} onClick={() => go(monthStart(t), t, "month")} className={`${btn} border`}>
        {pending && which === "month" && <Spinner />}This month
      </button>
      <button type="button" disabled={pending} onClick={() => go(last30, t, "30")} className={`${btn} border`}>
        {pending && which === "30" && <Spinner />}Last 30 days
      </button>
    </form>
  );
}
