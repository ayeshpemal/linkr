export default function LinkStatsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <header className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="h-3 w-24 rounded-full bg-orange-100" />
          <div className="mt-3 h-9 w-56 rounded-full bg-slate-200" />
          <div className="mt-4 h-4 w-72 rounded-full bg-slate-100" />
        </div>
        <div className="h-12 w-40 rounded-2xl bg-slate-100" />
      </header>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="rounded-3xl bg-slate-950 p-5">
          <div className="h-4 w-24 rounded-full bg-white/10" />
          <div className="mt-4 h-10 w-20 rounded-full bg-white/12" />
        </div>

        <div className="mt-6 h-85 rounded-3xl border border-slate-200 bg-slate-50" />
      </section>
    </div>
  );
}
