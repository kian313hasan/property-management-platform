import * as React from "react";
import { cn } from "@/lib/utils";

export const controlClasses =
  "w-full rounded-control border border-control-border bg-surface px-3 text-sm text-fg placeholder:text-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, invalid, ...props }, ref) => (
  <input ref={ref} aria-invalid={invalid || undefined} className={cn(controlClasses, "h-10", className)} {...props} />
));
Input.displayName = "Input";
