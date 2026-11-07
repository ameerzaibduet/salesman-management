import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { TABLES, isTxType, one, today, type SP } from "@/lib/format";
import { productNames } from "@/lib/data";
import { TransactionForm } from "@/components/TransactionForm";
import { Flash } from "@/components/Shell";

export default async function EditPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<SP>;
}) {
  const [{ type, id }, sp] = await Promise.all([params, searchParams]);
  if (!isTxType(type)) notFound();
  const { supabase } = await requireRole("admin");

  const { data: row } = await supabase.from(TABLES[type]).select("*").eq("id", id).maybeSingle();
  if (!row) notFound();

  const b = one(sp.back) ?? "/admin/dashboard";
  const back = b.startsWith("/") && !b.startsWith("//") ? b : "/admin/dashboard";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Flash sp={sp} />
      <p className="text-sm text-gray-500">
        Editing keeps the entry&apos;s current status ({row.status}). <a href={back} className="text-blue-600">← Back</a>
      </p>
      <TransactionForm
        type={type}
        back={back}
        today={today()}
        id={id}
        products={type === "payment" ? [] : await productNames(supabase)}
        defaults={{
          date: type === "payment" ? row.payment_date : row.entry_date,
          product_name: row.product_name,
          quantity: row.quantity,
          unit_price: row.unit_price,
          amount: row.amount,
          payment_method: row.payment_method,
          reference: row.reference,
          note: row.note,
        }}
      />
    </div>
  );
}
