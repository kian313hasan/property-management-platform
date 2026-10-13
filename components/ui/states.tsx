import type { ReactNode } from "react";

type StateProps = { title: string; hint?: string; action?: ReactNode };

export function EmptyState({ title, hint, action }: StateProps) {
  return (
    <section className="rounded-card border border-dashed border-border-strong bg-surface p-12 text-center">
      <h2 className="text-lg font-semibold text-fg">{title}</h2>
      {hint && <p className="mt-2 text-sm text-fg-muted">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </section>
  );
}

export function ErrorState({ title, hint, action }: StateProps) {
  return (
    <section role="alert" className="rounded-card border border-danger/30 bg-danger-soft p-12 text-center">
      <h2 className="text-lg font-semibold text-danger">{title}</h2>
      {hint && <p className="mt-2 text-sm text-fg-muted">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </section>
  );
}
