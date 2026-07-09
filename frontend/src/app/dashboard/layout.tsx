import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { logoutUser } from "@/actions/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("linkr_token");

  if (!token) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fef3c7_0%,#fff7ed_30%,#fff_68%)] px-6 py-8 text-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <nav className="flex items-center justify-between rounded-[1.75rem] border border-white/70 bg-white/80 px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-orange-600">
              Linkr
            </p>
            <p className="text-sm text-slate-500">Dashboard</p>
          </div>

          <form action={logoutUser}>
            <button
              type="submit"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:cursor-pointer">
              Logout
            </button>
          </form>
        </nav>

        <section className="rounded-4xl border border-white/70 bg-white/75 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          {children}
        </section>
      </div>
    </main>
  );
}
