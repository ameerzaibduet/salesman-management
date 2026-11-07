import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <form action={login} className="w-full max-w-md space-y-5 rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Salesman Management</h1>
        {error === "invalid" && (
          <p className="rounded bg-red-50 p-3 text-sm text-red-700">Invalid email or password.</p>
        )}
        {error === "disabled" && (
          <p className="rounded bg-red-50 p-3 text-sm text-red-700">This account is disabled. Contact the admin.</p>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input name="email" type="email" required className="w-full rounded-lg border p-3" placeholder="Enter email" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input name="password" type="password" required className="w-full rounded-lg border p-3" placeholder="Enter password" />
        </div>
        <button type="submit" className="w-full rounded-lg bg-black p-3 text-white">Login</button>
      </form>
    </main>
  );
}
