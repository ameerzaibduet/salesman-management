import { requireRole } from "@/lib/session";
import { Shell } from "@/components/Shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole("admin");
  return (
    <Shell
      title="Admin Panel"
      name={profile.full_name}
      links={[
        { href: "/admin/dashboard", label: "Dashboard" },
        { href: "/admin/dues", label: "Dues" },
        { href: "/admin/rain-suits", label: "Rain Suits" },
        { href: "/admin/approvals", label: "Pending Approvals" },
        { href: "/admin/users", label: "Salesmen" },
        { href: "/admin/products", label: "Products" },
        { href: "/admin/audit", label: "Audit Log" },
      ]}
    >
      {children}
    </Shell>
  );
}
