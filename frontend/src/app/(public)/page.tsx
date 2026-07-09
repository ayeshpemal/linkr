"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Link2, ShieldCheck } from "lucide-react";
import HighlightCard from "@/components/landing/HighlighCard";
import PreviewCard from "@/components/landing/PreviewCard";

const highlights = [
  {
    icon: Link2,
    title: "Shorten in seconds",
    description: "Create clean links fast and keep every campaign tidy from one workspace.",
  },
  {
    icon: BarChart3,
    title: "Track real engagement",
    description: "See click trends over time and understand which links are actually working.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    description: "Your dashboard is protected behind secure authentication and scoped stats.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#fef3c7_0%,#fff7ed_32%,#fff_72%)] text-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(249,115,22,0.08),transparent_35%,rgba(14,165,233,0.08))]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between rounded-full border border-white/70 bg-white/70 px-5 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-orange-600">
              Linkr
            </p>
            <p className="text-sm text-slate-500">Branded links with analytics</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-slate-200 bg-amber-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-amber-200">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
              Sign up
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-14 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700">
              Built for fast link sharing and clear reporting
            </div>

            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
              Short links that look sharp and show what happens next.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Linkr helps teams create compact URLs, monitor click activity, and keep campaign
              performance visible without digging through a messy toolchain.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800">
                Launch dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#highlights"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/85 px-6 py-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white">
                See what&apos;s inside
              </a>
            </div>
          </div>

          <PreviewCard />
        </section>

        <section id="highlights" className="grid gap-5 pb-10 md:grid-cols-3">
          {highlights.map((highlight) => {
            return <HighlightCard key={highlight.title} item={highlight} />;
          })}
        </section>
      </div>
    </main>
  );
}
