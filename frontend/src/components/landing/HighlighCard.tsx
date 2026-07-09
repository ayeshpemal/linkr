"use client";

export default function HighlightCard({
  variant = "default",
  item,
}: {
  variant?: "default" | "stats";
  item: {
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    title: string;
    description: string;
  };
}) {
  const Icon = item.icon;
  return (
    <article
      key={item.title}
      className="rounded-[1.75rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
      {Icon && (
        <div className="mb-4 inline-flex rounded-2xl bg-orange-100 p-3 text-orange-600">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h2
        className={`${variant === "stats" ? "text-lg font-semibold text-slate-950" : "text-xl font-semibold text-slate-950"}`}>
        {item.title}
      </h2>
      <p
        className={`${variant === "stats" ? "mt-3 text-2xl font-bold leading-6 text-slate-600" : "mt-3 text-sm leading-6 text-slate-600"}`}>
        {item.description}
      </p>
    </article>
  );
}
