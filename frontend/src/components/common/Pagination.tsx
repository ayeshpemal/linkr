"use client";

export default function Pagination({
  hasPreviousPage,
  hasNextPage,
  setPage,
  isLoading,
}: {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  isLoading: boolean;
}) {
  return (
    <div className="mt-5 flex items-center justify-between">
      <button
        type="button"
        onClick={() => {
          setPage((currentPage) => currentPage - 1);
        }}
        disabled={!hasPreviousPage || isLoading}
        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400  hover:cursor-pointer">
        Previous
      </button>

      <button
        type="button"
        onClick={() => {
          setPage((currentPage) => currentPage + 1);
        }}
        disabled={!hasNextPage || isLoading}
        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400  hover:cursor-pointer">
        Next
      </button>
    </div>
  );
}
