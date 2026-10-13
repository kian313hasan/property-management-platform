import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type FormPageProps = {
  backHref: string;
  /** Already-translated back-link text. */
  backLabel: string;
  title: string;
  hint?: string;
  children: ReactNode;
};

/** Page frame for "create" forms: back link plus a card with a title and optional hint. */
export function FormPage({ backHref, backLabel, title, hint, children }: FormPageProps) {
  return (
    <main className="min-h-screen bg-surface-muted text-fg">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-muted hover:underline">
          <span aria-hidden="true" className="rtl:rotate-180">
            ←
          </span>
          {backLabel}
        </Link>
        <Card className="mt-5">
          <CardContent className="p-7">
            <h1 className="text-2xl font-bold">{title}</h1>
            {hint && <p className="mt-2 text-sm text-fg-muted">{hint}</p>}
            {children}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
