import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href: string;
  logoUrl?: string | null;
}

export function CatalogBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-2.5 flex-wrap">
      {items.map((item, idx) => (
        <span key={item.href} className="flex items-center gap-2">
          {idx > 0 && (
            <span className="text-hint text-[0.5rem]" aria-hidden="true">
              ·
            </span>
          )}
          <Link
            href={item.href}
            className="flex items-center gap-1.5 text-hint hover:text-ink-muted transition-colors group"
          >
            {item.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.logoUrl}
                alt=""
                className="h-3.5 w-auto object-contain opacity-50 group-hover:opacity-75 transition-opacity"
                aria-hidden="true"
              />
            )}
            <span className="text-[0.52rem] uppercase tracking-[0.2em] font-bold leading-none">
              {item.label}
            </span>
          </Link>
        </span>
      ))}
    </div>
  );
}
