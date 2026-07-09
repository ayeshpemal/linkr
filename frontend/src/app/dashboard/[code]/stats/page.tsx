"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

import { getLinkStats } from "@/app/actions/links";

type DailyStat = {
  date: string;
  count: number;
};

type StatsState = {
  totalClicks: number;
  dailyStats: DailyStat[];
};

const rangeOptions = [
  { label: "Last 7 Days", value: 7 },
  { label: "Last 14 Days", value: 14 },
  { label: "Last 30 Days", value: 30 },
  { label: "Last 6 Months", value: 180 },
];

export default function LinkStatsPage() {
  const params = useParams<{ code: string }>();
  const code = params.code;

  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<StatsState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function formatDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function getZeroFilledStats(dailyStats: DailyStat[], selectedDays: number) {
    const countsByDate = new Map(dailyStats.map((stat) => [stat.date, stat.count]));
    const filledStats: DailyStat[] = [];

    for (let offset = selectedDays - 1; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);

      const formattedDate = formatDateKey(date);
      filledStats.push({
        date: formattedDate,
        count: countsByDate.get(formattedDate) ?? 0,
      });
    }

    return filledStats;
  }

  useEffect(() => {
    let isCancelled = false;

    async function fetchStats() {
      setIsLoading(true);

      const result = await getLinkStats(code, days);
      if (isCancelled) {
        return;
      }

      if (!result.success) {
        setError(result.error);
        return;
      }

      setIsLoading(false);
      setError(null);
      setStats({
        totalClicks: result.totalClicks,
        dailyStats: result.dailyStats,
      });
    }

    void fetchStats();

    return () => {
      isCancelled = true;
    };
  }, [code, days]);

  const hasNoClicks = stats !== null && stats.totalClicks === 0 && stats.dailyStats.length === 0;
  const chartData = stats ? getZeroFilledStats(stats.dailyStats, days) : [];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-600">
            Link Analytics
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Stats for /{code}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Review how this short link is performing across the selected time range.
          </p>
        </div>
      </header>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-8 text-sm text-rose-700">
            {error}
          </div>
        ) : stats === null || isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-16 text-center text-sm text-slate-500">
            Loading stats...
          </div>
        ) : hasNoClicks ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-16 text-center">
            <p className="text-lg font-semibold text-slate-950">No clicks yet</p>
            <p className="mt-2 text-sm text-slate-500">
              This link has not received any tracked visits in the selected range.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-3xl bg-slate-950 p-5 text-white">
              <p className="text-sm text-slate-300">Total Clicks</p>
              <p className="mt-2 text-4xl font-semibold">{stats.totalClicks}</p>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Time Range
              <select
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
                disabled={isLoading}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100">
                {rangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="h-85 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="date"
                    minTickGap={50}
                    tickFormatter={(value: string) =>
                      new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                    stroke="#64748b"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis allowDecimals={false} stroke="#64748b" tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#ea580c"
                    strokeWidth={3}
                    dot={{ r: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
