"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

export type DayPoint = { day: string; taken: number; returned: number; paid: number };

export function ActivityChart({ data }: { data: DayPoint[] }) {
  return (
    <div className="h-72 w-full rounded-xl border bg-white p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" tickFormatter={(d: string) => d.slice(5)} fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip formatter={(v) => `Rs. ${Number(v).toLocaleString()}`} />
          <Legend />
          <Bar dataKey="taken" name="Taken" fill="#2563eb" />
          <Bar dataKey="returned" name="Returned" fill="#f59e0b" />
          <Bar dataKey="paid" name="Payments" fill="#16a34a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
