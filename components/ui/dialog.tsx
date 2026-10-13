"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./button";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Translated accessible name for the close button. */
  closeLabel: string;
  children?: ReactNode;
};

/**
 * Modal dialog built on the native <dialog> element, which provides focus trapping, Escape-to-close,
 * inert background content and focus restoration without an extra dependency.
 */
export function Dialog({ open, onClose, title, description, closeLabel, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className="m-auto w-full max-w-md rounded-card border border-border bg-surface p-0 text-fg shadow-overlay backdrop:bg-slate-900/50"
    >
      <div className="p-6">
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="mt-2 text-sm text-fg-muted">
            {description}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            {closeLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
