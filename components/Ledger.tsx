import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PAGE_SIZE, TABLES, hrefWith, money, pageOf, type SP, type TxType } from "@/lib/format";
import { deleteTransaction } from "@/app/actions/transactions";
import { Badge } from "@/components/Shell";

const PAGE_KEY: Record<TxType, string> = { sale: "sp", return: "rp", payment: "pp" };
const TITLE: Record<TxType, string> = {
  sale: "Products Taken",
  return: "Products Returned",
  payment: "Payments",
};

type Row = Record<string, any>;

export async function Ledger({
  supabase,
  salesmanId,
  path,
  sp,
  range,
  types = ["sale", "return", "payment"],
  admin = false,
  columns = 3,
}: {
  supabase: SupabaseClient;
  salesmanId: string;
  path: string;
  sp: SP;
  range: { from: string; to: string };
  types?: TxType[];
  admin?: boolean;
  columns?: 1 | 3;
}) {
  const blocks = await Promise.all(
    types.map(async (type) => {
      const dateCol = type === "payment" ? "payment_date" : "entry_date";
      const page = pageOf(sp, PAGE_KEY[type]);
      const { data, count } = await supabase
        .from(TABLES[type])
        .select("*", { count: "exact" })
        .eq("salesman_id", salesmanId)
        .gte(dateCol, range.from)
        .lte(dateCol, range.to)
        .order(dateCol, { ascending: false })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      return { type, page, rows: (data ?? []) as Row[], count: count ?? 0 };
    })
  );

  const grid = columns === 3 ? "grid gap-4 xl:grid-cols-3" : "grid gap-4";

  return (
    <div className={grid}>
      {blocks.map(({ type, page, rows, count }) => {
        const lastPage = Math.max(0, Math.ceil(count / PAGE_SIZE) - 1);
        return (
          <section key={type} className="overflow-x-auto rounded-xl border bg-white">
            <h3 className="border-b p-3 font-semibold">
              {TITLE[type]} <span className="text-sm font-normal text-gray-500">({count})</span>
            </h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="p-2">Date</th>
                  {type === "payment" ? (
                    <th className="p-2">Method</th>
                  ) : (
                    <>
                      <th className="p-2">Product</th>
                      <th className="p-2 text-right">Qty × Price</th>
                    </>
                  )}
                  <th className="p-2 text-right">Total</th>
                  <th className="p-2">Status</th>
                  {admin && <th className="p-2" />}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-400">
                      No records
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="p-2 whitespace-nowrap">{type === "payment" ? r.payment_date : r.entry_date}</td>
                    {type === "payment" ? (
                      <td className="p-2 capitalize">
                        {r.payment_method}
                        {r.reference ? <div className="text-xs text-gray-400">{r.reference}</div> : null}
                      </td>
                    ) : (
                      <>
                        <td className="p-2">{r.product_name}</td>
                        <td className="p-2 text-right whitespace-nowrap">
                          {Number(r.quantity)} × {Number(r.unit_price).toLocaleString()}
                        </td>
                      </>
                    )}
                    <td className="p-2 text-right font-medium">{money(type === "payment" ? r.amount : r.total)}</td>
                    <td className="p-2">
                      <Badge status={r.status} />
                      {r.status === "rejected" && r.rejection_reason ? (
                        <div className="mt-1 text-xs text-red-600">{r.rejection_reason}</div>
                      ) : null}
                    </td>
                    {admin && (
                      <td className="p-2 whitespace-nowrap">
                        <Link
                          href={`/admin/edit/${type}/${r.id}?back=${encodeURIComponent(path)}`}
                          className="mr-2 text-blue-600"
                        >
                          Edit
                        </Link>
                        <form action={deleteTransaction} className="inline">
                          <input type="hidden" name="type" value={type} />
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="back" value={path} />
                          <button className="text-red-600">Delete</button>
                        </form>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t p-2 text-sm">
              {page > 0 ? (
                <Link href={hrefWith(path, sp, { [PAGE_KEY[type]]: page - 1 })} className="rounded border px-2 py-1">
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-gray-500">
                Page {page + 1} / {lastPage + 1}
              </span>
              {page < lastPage ? (
                <Link href={hrefWith(path, sp, { [PAGE_KEY[type]]: page + 1 })} className="rounded border px-2 py-1">
                  Next
                </Link>
              ) : (
                <span />
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
