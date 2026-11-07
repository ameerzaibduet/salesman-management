import { requireRole } from "@/lib/session";

export default async function AuditPage() {
  const { supabase } = await requireRole("admin");
  const { data } = await supabase
    .from("audit_logs")
    .select("*, actor:profiles!actor_id(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <section className="overflow-x-auto rounded-xl border bg-white">
      <h3 className="border-b p-3 font-semibold">Admin activity (latest 100)</h3>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr><th className="p-2">When</th><th className="p-2">Admin</th><th className="p-2">Action</th><th className="p-2">Table</th><th className="p-2">Details</th></tr>
        </thead>
        <tbody>
          {(data ?? []).map((l: any) => (
            <tr key={l.id} className="border-t align-top">
              <td className="p-2 whitespace-nowrap">{new Date(l.created_at).toLocaleString("en-GB", { timeZone: "Asia/Karachi" })}</td>
              <td className="p-2">{l.actor?.full_name}</td>
              <td className="p-2">{l.action}</td>
              <td className="p-2">{l.table_name}</td>
              <td className="p-2 text-xs text-gray-500">
                <details>
                  <summary className="cursor-pointer">view</summary>
                  <pre className="max-w-md overflow-auto whitespace-pre-wrap">{JSON.stringify({ old: l.old_data, new: l.new_data }, null, 1)}</pre>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
