import { Bricolage_Grotesque, Noto_Nastaliq_Urdu } from "next/font/google";
import { login } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { PasswordInput } from "@/components/PasswordInput";

const sans = Bricolage_Grotesque({ subsets: ["latin"], display: "swap" });
const urdu = Noto_Nastaliq_Urdu({ subsets: ["arabic"], weight: ["600", "700"], display: "swap" });

const field =
  "w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-[15px] text-stone-900 placeholder:text-stone-400 " +
  "focus:border-[#0f3d2e] focus:outline-none focus:ring-4 focus:ring-[#0f3d2e]/15";

const ERRORS: Record<string, string> = {
  invalid: "Email or password is wrong. Check both and try again.",
  disabled: "This account is disabled. Ask the admin to enable it.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error ? ERRORS[error] : undefined;

  return (
    <main className={`${sans.className} grid min-h-screen bg-white text-stone-900 lg:grid-cols-[1.05fr_1fr]`}>
      {/* Brand side */}
      <aside className="relative flex flex-col justify-between overflow-hidden bg-[#0f3d2e] px-8 py-10 text-[#f2efe4] lg:px-14 lg:py-14">
        {/* diamond lattice */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #d9a441 0 1px, transparent 1px 34px), repeating-linear-gradient(-45deg, #d9a441 0 1px, transparent 1px 34px)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-[#d9a441] opacity-[0.12] blur-3xl"
        />

        <div className="relative">
          <p lang="ur" dir="rtl" className={`${urdu.className} text-left text-[3.4rem] leading-[1.9] text-[#e7b95a] lg:text-[6.5rem] lg:leading-[1.8]`}>
            بن وطن
          </p>
          <p className="-mt-2 text-xl font-semibold tracking-wide lg:-mt-4 lg:text-2xl">Bin Watan</p>
        </div>

        <div className="relative mt-10 hidden max-w-md lg:block">
          <h2 className="text-4xl font-semibold leading-[1.15] tracking-tight">
            Every product out, every rupee back, in one ledger.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[#f2efe4]/75">
            Daily entries from every salesman, checked and approved by you, with dues that are always up to date.
          </p>
        </div>
      </aside>

      {/* Form side */}
      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <form action={login} className="w-full max-w-sm">
          <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-stone-600">Use the email and password the admin gave you.</p>

          {message && (
            <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {message}
            </p>
          )}

          <div className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-stone-800">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="username"
                inputMode="email"
                placeholder="you@example.com"
                className={field}
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-stone-800">
                Password
              </label>
              <PasswordInput
                id="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="Your password"
                className={field}
              />
            </div>
          </div>

          <SubmitButton className="mt-8 w-full rounded-lg bg-[#0f3d2e] px-4 py-3.5 text-[15px] font-semibold text-white shadow-sm hover:bg-[#0b2f23] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b9831f]">
            Sign in
          </SubmitButton>

          <p className="mt-6 text-sm text-stone-500">Forgot your password? Ask the admin to reset it.</p>
        </form>
      </section>
    </main>
  );
}
