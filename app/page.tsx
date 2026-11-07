import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";

export default async function Home() {
  const { profile } = await requireUser();
  redirect(profile.role === "admin" ? "/admin/dashboard" : "/salesman/dashboard");
}
