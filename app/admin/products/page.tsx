import { requireRole } from "@/lib/session";
import type { SP } from "@/lib/format";
import { Flash } from "@/components/Shell";
import { addProduct, toggleProduct } from "./actions";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { supabase } = await requireRole("admin");
  const { data } = await supabase.from("products").select("*").order("name");
  return (
    <>
      <Flash sp={sp} />
      <p className="text-sm text-gray-500">
        Products here only feed the suggestion list on salesman forms. Prices are entered manually per entry.
      </p>
      <form action={addProduct} className="flex gap-2 rounded-xl border bg-white p-4">
        <input name="name" required placeholder="Product name" className="flex-1 rounded-lg border p-2" />
        <button className="rounded-lg bg-black px-4 py-2 text-white">Add</button>
      </form>
      <section className="rounded-xl border bg-white">
        {(data ?? []).map((p: any) => (
          <form key={p.id} action={toggleProduct} className="flex items-center justify-between border-b p-3 last:border-0">
            <span className={p.is_active ? "" : "text-gray-400 line-through"}>{p.name}</span>
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="active" value={String(!p.is_active)} />
            <button className="rounded border px-2 py-1 text-sm">{p.is_active ? "Hide" : "Show"}</button>
          </form>
        ))}
      </section>
    </>
  );
}
