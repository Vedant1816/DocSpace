import { ArrowLink, Icon, Reveal, Skeleton } from "../ui";

function decodeHTML(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

/** News / WHO feed list used on the doctor and hospital home pages. */
export default function FeedColumn({ title, to, loading, items, kind }) {
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="ds-display text-[22px]">{title}</h3>
        <ArrowLink to={to}>View all</ArrowLink>
      </div>
      <div className="border-t border-gray-200">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-b border-gray-200 py-5">
              <Skeleton className="h-16 w-24 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <p className="py-10 text-sm text-gray-500">Nothing new right now. Check back later.</p>
        ) : (
          items.map((a, i) => (
            <Reveal key={`${a.url}-${i}`} delay={i * 0.04}>
              <a href={a.url} target="_blank" rel="noopener noreferrer" className="group flex gap-4 border-b border-gray-200 py-5" data-card>
                {a.image && (
                  <span className="h-16 w-24 shrink-0 overflow-hidden rounded bg-gray-100">
                    <img
                      src={a.image}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 ease-[var(--ease-out)] group-hover:scale-105"
                      onError={(e) => (e.currentTarget.parentElement.style.display = "none")}
                    />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 font-semibold text-gray-900 transition-colors duration-150 group-hover:text-coral-700">{a.title}</span>
                  <span className="mt-1 line-clamp-2 block text-sm text-gray-500">
                    {kind === "who" ? decodeHTML(a.description || "").replace(/<[^>]+>/g, "").slice(0, 140) : a.description}
                  </span>
                  <span className="mt-2 block ds-label">
                    {kind === "who" ? (a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : "WHO") : a.source}
                  </span>
                </span>
                <Icon name="arrow_outward" className="mt-1 text-gray-300 transition-[color,transform] duration-300 ease-[var(--ease-out)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
              </a>
            </Reveal>
          ))
        )}
      </div>
    </div>
  );
}
