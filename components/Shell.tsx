import Link from "next/link";
import { logout } from "@/app/login/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function Shell({
  title,
  name,
  links,
  children,
}: {
  title: string;
  name: string;
  links: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="font-semibold">{title}</div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600">{name}</span>
            <form action={logout}>
              <SubmitButton className="rounded border px-3 py-1 hover:bg-gray-100">Logout</SubmitButton>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap rounded px-3 py-1.5 hover:bg-gray-100">
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl space-y-6 p-4">{children}</main>
    </div>
  );
}

export function Flash({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  const ok = Array.isArray(sp.ok) ? sp.ok[0] : sp.ok;
  if (error) return <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>;
  if (ok) return <p className="rounded bg-green-50 p-3 text-sm text-green-700">{ok}</p>;
  return null;
}

export function Card({ label, value, tone }: { label: string; value: string; tone?: "red" | "green" }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div
        className={`mt-1 text-2xl font-bold ${
          tone === "red" ? "text-red-600" : tone === "green" ? "text-green-600" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export function Badge({ status }: { status: string }) {
  const c =
    status === "approved"
      ? "bg-green-100 text-green-700"
      : status === "rejected"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-800";
  return <span className={`rounded-full px-2 py-0.5 text-xs ${c}`}>{status}</span>;
}
