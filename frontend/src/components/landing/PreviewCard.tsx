"use client";

export default function PreviewCard() {
  return (
    <div className="relative">
      <div className="absolute -left-6 top-10 h-28 w-28 rounded-full bg-orange-200/50 blur-3xl" />
      <div className="absolute -right-6 bottom-0 h-36 w-36 rounded-full bg-sky-200/50 blur-3xl" />

      <div className="relative rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_30px_120px_rgba(15,23,42,0.18)] backdrop-blur">
        <div className="rounded-3xl bg-slate-950 p-6 text-white">
          <p className="text-xs uppercase tracking-[0.28em] text-orange-300">Campaign Snapshot</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/8 p-4">
              <p className="text-sm text-slate-300">Links created</p>
              <p className="mt-2 text-3xl font-semibold">128</p>
            </div>
            <div className="rounded-2xl bg-white/8 p-4">
              <p className="text-sm text-slate-300">Clicks today</p>
              <p className="mt-2 text-3xl font-semibold">4,892</p>
            </div>
            <div className="rounded-2xl bg-white/8 p-4">
              <p className="text-sm text-slate-300">Top link CTR</p>
              <p className="mt-2 text-3xl font-semibold">18.4%</p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Recent activity</p>
              <p className="text-xl font-semibold text-slate-950">Engagement is trending up</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              +24%
            </span>
          </div>

          <div className="mt-6 flex items-end gap-3">
            {[36, 58, 42, 74, 69, 96, 88].map((height, index) => (
              <div key={index} className="flex-1">
                <div
                  className="rounded-t-2xl bg-linear-to-t from-orange-500 to-amber-300"
                  style={{ height: `${height * 1.2}px` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
