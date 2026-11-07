export const PAGE_SIZE = 30;
const TZ = "Asia/Karachi";

export function money(n: number | string | null | undefined) {
  const v = Number(n ?? 0);
  return `Rs. ${v.toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
}

export function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type SP = Record<string, string | string[] | undefined>;

export function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

/** Default range: this month. Accepts ?from=YYYY-MM-DD&to=YYYY-MM-DD */
export function resolveRange(sp: SP) {
  const t = today();
  const f = one(sp.from);
  const e = one(sp.to);
  let from = f && DATE_RE.test(f) ? f : t.slice(0, 8) + "01";
  let to = e && DATE_RE.test(e) ? e : t;
  if (from > to) [from, to] = [to, from];
  return { from, to };
}

export function pageOf(sp: SP, key: string) {
  const n = parseInt(one(sp[key]) ?? "0", 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function hrefWith(basePath: string, sp: SP, patch: Record<string, string | number>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const val = one(v);
    if (val !== undefined && k !== "error" && k !== "ok") q.set(k, val);
  }
  for (const [k, v] of Object.entries(patch)) q.set(k, String(v));
  return `${basePath}?${q.toString()}`;
}

export const TABLES = {
  sale: "sales",
  return: "returns",
  payment: "payments",
} as const;
export type TxType = keyof typeof TABLES;
export function isTxType(v: string): v is TxType {
  return v in TABLES;
}
