"use client";

import { LinkItem } from "@/types/dashboard";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const shortURLBase = process.env.NEXT_PUBLIC_SHORT_URL_BASE || "http://localhost:8080";

export default function LinkItemCard({ link }: { link: LinkItem }) {
  const router = useRouter();
  return (
    <div
      key={link.id}
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/dashboard/${link.short_code}/stats`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/dashboard/${link.short_code}/stats`);
        }
      }}
      className="grid cursor-pointer gap-3 px-5 py-4 transition hover:bg-slate-50 focus:outline-none focus:ring-0 md:grid-cols-[1.1fr_2fr_0.7fr] md:items-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 md:hidden">
          Short URL
        </p>
        <Link
          href={`${shortURLBase}/${link.short_code}`}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          className="inline-flex items-center gap-2 font-semibold text-orange-600 transition hover:text-orange-700 hover:underline">
          <span>{link.short_code}</span>
          <ExternalLink className="h-4 w-4" />
        </Link>
        <p className="mt-2 text-xs font-medium text-slate-400">Click row to view stats</p>
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 md:hidden">
          Target URL
        </p>
        <p className="truncate text-sm text-slate-700">{link.url}</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 md:hidden">
          Total Clicks
        </p>
        <p className="text-sm font-semibold text-slate-950">{link.click_count}</p>
      </div>
    </div>
  );
}
