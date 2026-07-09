"use client";

import { SubmitEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

import { createLink, getLinks } from "@/app/actions/links";

type LinkItem = {
  id: string;
  user_id: string;
  short_code: string;
  url: string;
  click_count: number;
  created_at: string;
};

type LinksMeta = {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

const emptyMeta: LinksMeta = {
  total: 0,
  page: 1,
  limit: 10,
  total_pages: 0,
};

const shortURLBase = process.env.NEXT_PUBLIC_SHORT_URL_BASE || "http://localhost:8080";

export default function DashboardPage() {
  const router = useRouter();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [meta, setMeta] = useState<LinksMeta>(emptyMeta);
  const [page, setPage] = useState(1);
  const [url, setURL] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [totalClicks, setTotalClicks] = useState(0);

  async function loadLinks(nextPage: number) {
    setIsLoading(true);

    const result = await getLinks(nextPage);
    if (!result.success) {
      toast.error(result.error);
      setIsLoading(false);
      return;
    }

    setTotalClicks(result.data.reduce((sum, link) => sum + link.click_count, 0));

    setLinks(result.data);
    setMeta(result.meta);
    setIsLoading(false);
  }

  useEffect(() => {
    async function initLinks() {
      await loadLinks(page);
    }

    void initLinks();
  }, [page]);

  function handleCreateLink(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createLink(formData);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Link created successfully");
      setURL("");
      await loadLinks(page);
    });
  }

  const hasPreviousPage = meta.page > 1;
  const hasNextPage = meta.total_pages > meta.page;

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-8">
        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-600">
              Create Link
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Add a new destination
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Paste a long URL and generate a short link you can track from this dashboard.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleCreateLink}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Long URL</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  name="url"
                  type="url"
                  placeholder="https://example.com/your-campaign"
                  value={url}
                  onChange={(event) => setURL(event.target.value)}
                  disabled={isPending}
                  required
                />
              </label>

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400">
                {isPending ? "Creating..." : "Create Link"}
              </button>
            </form>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 text-white shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300">
              Overview
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-100 p-4 border border-slate-200">
                <p className="text-sm text-slate-600">Total links</p>
                <p className="mt-2 text-3xl font-semibold text-slate-800">{meta.total}</p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-4 border border-slate-200">
                <p className="text-sm text-slate-600">Total Clicks</p>
                <p className="mt-2 text-3xl font-semibold text-slate-800">{totalClicks}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-600">
                Links List
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Your recent links
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              Showing page {meta.page} of {Math.max(meta.total_pages, 1)}
            </p>
          </div>

          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
            <div className="hidden grid-cols-[1.1fr_2fr_0.7fr] gap-4 bg-slate-50 px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 md:grid">
              <span>Short URL</span>
              <span>Target URL</span>
              <span>Total Clicks</span>
            </div>

            {isLoading ? (
              <div className="px-5 py-12 text-center text-sm text-slate-500">Loading links...</div>
            ) : links.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-slate-500">
                No links yet. Create your first short link above.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {links.map((link) => (
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
                      <a
                        href={`${shortURLBase}/${link.short_code}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                        className="inline-flex items-center gap-2 font-semibold text-orange-600 transition hover:text-orange-700 hover:underline">
                        <span>{link.short_code}</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <p className="mt-2 text-xs font-medium text-slate-400">
                        Click row to view stats
                      </p>
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
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setPage((currentPage) => currentPage - 1);
              }}
              disabled={!hasPreviousPage || isLoading}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
              Previous
            </button>

            <button
              type="button"
              onClick={() => {
                setPage((currentPage) => currentPage + 1);
              }}
              disabled={!hasNextPage || isLoading}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400">
              Next
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
