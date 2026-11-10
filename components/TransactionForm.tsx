"use client";

import { useState } from "react";
import { saveTransaction } from "@/app/actions/transactions";
import { SubmitButton } from "@/components/SubmitButton";

type Defaults = {
  date?: string;
  product_name?: string;
  quantity?: number | string;
  unit_price?: number | string;
  amount?: number | string;
  payment_method?: string;
  reference?: string | null;
  note?: string | null;
};

const LABEL = { sale: "Products Taken", return: "Return Products", payment: "Payment" } as const;

export function TransactionForm({
  type,
  back,
  today,
  products = [],
  salesmanId,
  id,
  defaults = {},
  submitLabel,
}: {
  type: "sale" | "return" | "payment";
  back: string;
  today: string;
  products?: string[];
  salesmanId?: string; // admin on-behalf entries
  id?: string; // admin edit
  defaults?: Defaults;
  submitLabel?: string;
}) {
  const [qty, setQty] = useState(String(defaults.quantity ?? ""));
  const [price, setPrice] = useState(String(defaults.unit_price ?? ""));
  const total = (Number(qty) || 0) * (Number(price) || 0);
  const input = "w-full rounded-lg border p-2";

  return (
    <form action={saveTransaction} className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
      <h3 className="font-semibold sm:col-span-2">{LABEL[type]}</h3>
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="back" value={back} />
      {salesmanId && <input type="hidden" name="salesman_id" value={salesmanId} />}
      {id && <input type="hidden" name="id" value={id} />}

      <label className="text-sm">
        Date
        <input type="date" name="date" required defaultValue={defaults.date ?? today} className={input} />
      </label>

      {type === "payment" ? (
        <>
          <label className="text-sm">
            Amount (Rs.)
            <input type="number" name="amount" min="0.01" step="0.01" required defaultValue={defaults.amount} className={input} />
          </label>
          <label className="text-sm">
            Method
            <select name="payment_method" defaultValue={defaults.payment_method ?? "cash"} className={input}>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="text-sm">
            Reference (optional)
            <input name="reference" defaultValue={defaults.reference ?? ""} className={input} />
          </label>
        </>
      ) : (
        <>
          <label className="text-sm">
            Product
            <select name="product_name" required defaultValue={defaults.product_name ?? ""} className={input}>
              <option value="" disabled>Select product</option>
              {defaults.product_name && !products.includes(defaults.product_name) && (
                <option value={defaults.product_name}>{defaults.product_name}</option>
              )}
              {products.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Quantity
            <input type="number" name="quantity" min="0.01" step="0.01" required value={qty} onChange={(e) => setQty(e.target.value)} className={input} />
          </label>
          <label className="text-sm">
            Unit price (Rs.)
            <input type="number" name="unit_price" min="0" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} className={input} />
          </label>
          <div className="text-sm">
            Total
            <div className="rounded-lg border bg-gray-50 p-2 font-semibold">Rs. {total.toLocaleString()}</div>
          </div>
        </>
      )}

      <label className="text-sm sm:col-span-2">
        Note (optional)
        <input name="note" defaultValue={defaults.note ?? ""} className={input} />
      </label>

      <div className="sm:col-span-2">
        <SubmitButton className="rounded-lg bg-black px-4 py-2 text-white">
          {submitLabel ?? (salesmanId || id ? "Save" : "Submit for approval")}
        </SubmitButton>
      </div>
    </form>
  );
}
