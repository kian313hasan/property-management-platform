import { cn } from "@/lib/utils";

/** `label` is announced to screen readers; pass a translated string. */
export function Spinner({ label, className }: { label: string; className?: string }) {
  return (
    <span role="status" className={cn("inline-flex items-center gap-2 text-sm text-fg-muted", className)}>
      <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-border-strong border-t-primary" />
      <span>{label}</span>
    </span>
  );
}

/** Placeholder block shown while content loads. Decorative, so hidden from assistive technology. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-control bg-border", className)} />;
}
