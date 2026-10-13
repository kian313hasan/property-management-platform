import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva("rounded-control border px-4 py-3 text-sm", {
  variants: {
    tone: {
      info: "border-info/30 bg-info-soft text-info",
      success: "border-success/30 bg-success-soft text-success",
      warning: "border-warning/30 bg-warning-soft text-warning",
      danger: "border-danger/30 bg-danger-soft text-danger",
    },
  },
  defaultVariants: { tone: "info" },
});

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

/** Errors and warnings are announced immediately (`alert`); informational messages politely (`status`). */
export function Alert({ className, tone, ...props }: AlertProps) {
  const role = tone === "danger" || tone === "warning" ? "alert" : "status";
  return <div role={role} className={cn(alertVariants({ tone }), className)} {...props} />;
}
