"use client";

import { SubmitEvent, useEffect, useState, useTransition } from "react";
import { Toaster, toast } from "react-hot-toast";

import { createLink, getLinks } from "@/actions/links";
import { LinkItem, LinksMeta } from "../../types/dashboard";
import Pagination from "@/components/common/Pagination";
import LinkItemCard from "@/components/dashboard/LinkItemCard";
import HighlightCard from "@/components/landing/HighlighCard";

const emptyMeta: LinksMeta = {
  total: 0,
  page: 1,
  limit: 10,
  total_pages: 0,
};

export default function DashboardPage() {
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
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 hover:cursor-pointer">
                {isPending ? "Creating..." : "Create Link"}
              </button>
            </form>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 text-white shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300">
              Overview
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <HighlightCard
                key={"total_links"}
                variant="stats"
                item={{ title: "Total links", description: `${meta.total}` }}
              />
              <HighlightCard
                key={"total_clicks"}
                variant="stats"
                item={{ title: "Total Clicks", description: `${totalClicks}` }}
              />
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
                  <LinkItemCard key={link.id} link={link} />
                ))}
              </div>
            )}
          </div>

          <Pagination
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
            setPage={setPage}
            isLoading={isLoading}
          />
        </section>
      </div>
    </>
  );
}
