import { Link } from "@tanstack/react-router";

export function BreakingTicker({
  items,
}: {
  items: { id: string; text: string; link: string | null }[];
}) {
  if (!items.length) return null;
  const doubled = [...items, ...items];
  return (
    <div className="bg-primary text-primary-foreground">
      <div className="container mx-auto max-w-7xl px-4 flex items-center gap-3 min-h-12 py-1.5 overflow-hidden">
        <span className="shrink-0 text-xs font-bold uppercase tracking-wider bg-primary-foreground/10 px-2 py-1 rounded">
          ब्रेकिंग
        </span>
        <div className="relative flex-1 overflow-hidden">
          <div className="ticker-track flex whitespace-nowrap gap-10 w-max">
            {doubled.map((b, i) => (
              <span key={`${b.id}-${i}`} className="text-sm">
                {b.link ? (
                  <Link to={b.link} className="hover:underline">
                    {b.text}
                  </Link>
                ) : (
                  b.text
                )}
                <span className="mx-6 opacity-60">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}