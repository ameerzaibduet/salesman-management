import Link from "next/link";
import { requireRole } from "@/lib/session";
import type { SP } from "@/lib/format";
import { Flash } from "@/components/Shell";
import { createSalesman, resetPassword, setActive } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function UsersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { supabase } = await requireRole("admin");
  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  const users = (data ?? []) as any[];
  const input = "w-full rounded-lg border p-2";

  return (
    <>
      <Flash sp={sp} />
      <form action={createSalesman} className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
        <h3 className="font-semibold sm:col-span-2">Create salesman account</h3>
        <label className="text-sm">Full name<input name="full_name" required className={input} /></label>
        <label className="text-sm">Username<input name="username" className={input} /></label>
        <label className="text-sm">Email (used to log in)<input name="email" type="email" required className={input} /></label>
        <label className="text-sm">Phone<input name="phone" className={input} /></label>
        <label className="text-sm">Password (min 10 chars)<input name="password" type="text" minLength={10} required className={input} /></label>
        <label className="text-sm">Address<input name="address" className={input} /></label>
        <div className="sm:col-span-2">
          <SubmitButton className="rounded-lg bg-black px-4 py-2 text-white">Create account</SubmitButton>
        </div>
      </form>

      <section className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Phone</th>
              <th className="p-2">Role</th><th className="p-2">Status</th><th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t align-top">
                <td className="p-2">
                  {u.role === "salesman" ? (
                    <Link href={`/admin/accounts/${u.id}`} className="text-blue-600 hover:underline">{u.full_name}</Link>
                  ) : u.full_name}
                  {u.username && <div className="text-xs text-gray-400">@{u.username}</div>}
                </td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.phone}</td>
                <td className="p-2 capitalize">{u.role}</td>
                <td className="p-2">{u.is_active ? "Active" : "Disabled"}</td>
                <td className="space-y-2 p-2">
                  <form action={setActive}>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="active" value={String(!u.is_active)} />
                    <SubmitButton className="rounded border px-2 py-1">{u.is_active ? "Disable" : "Enable"}</SubmitButton>
                  </form>
                  <form action={resetPassword} className="flex gap-1">
                    <input type="hidden" name="id" value={u.id} />
                    <input name="password" type="text" minLength={10} required placeholder="New password" className="w-36 rounded border p-1" />
                    <SubmitButton className="rounded border px-2 py-1">Reset</SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
