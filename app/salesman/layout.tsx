import { requireRole } from "@/lib/session";
import { Shell } from "@/components/Shell";

export default async function SalesmanLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole("salesman");
  return (
    <Shell
      title="My Account"
      name={profile.full_name}
      links={[
        { href: "/salesman/dashboard", label: "Dashboard" },
        { href: "/salesman/sales", label: "Products Taken" },
        { href: "/salesman/returns", label: "Return Products" },
        { href: "/salesman/payments", label: "Payments" },
      ]}
    >
      {children}
    </Shell>
  );
}
