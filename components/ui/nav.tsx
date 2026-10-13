import Link from "next/link";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string };

/** Primary navigation. `activeHref` marks the current page for assistive technology (aria-current). */
export function NavList({ items, activeHref, label }: { items: readonly NavItem[]; activeHref?: string; label: string }) {
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap gap-1">
        {items.map((item) => {
          const active = item.href === activeHref;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center rounded-control px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "bg-primary text-primary-fg" : "text-fg hover:bg-surface-muted",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
