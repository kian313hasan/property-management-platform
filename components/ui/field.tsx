import type { ReactNode } from "react";
import { Label } from "./label";

type FieldProps = {
  /** `id` of the control this field labels. */
  htmlFor: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

/**
 * Label + control + optional hint/error. The control should set `aria-describedby` to
 * `${htmlFor}-hint` / `${htmlFor}-error` when those are rendered.
 */
export function Field({ htmlFor, label, hint, error, children }: FieldProps) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="mt-1.5 text-xs text-fg-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
