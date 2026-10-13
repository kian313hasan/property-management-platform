import * as React from "react";
import { cn } from "@/lib/utils";
import { controlClasses } from "./input";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, invalid, ...props }, ref) => (
  <select ref={ref} aria-invalid={invalid || undefined} className={cn(controlClasses, "h-10", className)} {...props} />
));
Select.displayName = "Select";
