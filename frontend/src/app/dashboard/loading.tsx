export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="h-3 w-24 rounded-full bg-orange-100" />
          <div className="mt-4 h-9 w-56 rounded-full bg-slate-200" />
          <div className="mt-4 h-4 w-full rounded-full bg-slate-100" />
          <div className="mt-2 h-4 w-4/5 rounded-full bg-slate-100" />
          <div className="mt-8 h-12 w-full rounded-2xl bg-slate-100" />
          <div className="mt-4 h-11 w-32 rounded-2xl bg-slate-200" />
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
          <div className="h-3 w-20 rounded-full bg-white/15" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/8 p-4">
              <div className="h-4 w-24 rounded-full bg-white/10" />
              <div className="mt-4 h-9 w-16 rounded-full bg-white/12" />
            </div>
            <div className="rounded-2xl bg-white/8 p-4">
              <div className="h-4 w-24 rounded-full bg-white/10" />
              <div className="mt-4 h-9 w-16 rounded-full bg-white/12" />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="h-3 w-20 rounded-full bg-orange-100" />
            <div className="mt-3 h-8 w-44 rounded-full bg-slate-200" />
          </div>
          <div className="h-4 w-32 rounded-full bg-slate-100" />
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
          <div className="hidden grid-cols-[1.1fr_2fr_0.7fr] gap-4 bg-slate-50 px-5 py-4 md:grid">
            <div className="h-3 w-20 rounded-full bg-slate-200" />
            <div className="h-3 w-20 rounded-full bg-slate-200" />
            <div className="h-3 w-20 rounded-full bg-slate-200" />
          </div>

          <div className="divide-y divide-slate-200">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="grid gap-3 px-5 py-5 md:grid-cols-[1.1fr_2fr_0.7fr] md:items-center"
              >
                <div className="h-5 w-32 rounded-full bg-slate-200" />
                <div className="h-5 w-full rounded-full bg-slate-100" />
                <div className="h-5 w-14 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
