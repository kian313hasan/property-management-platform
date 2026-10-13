import * as React from "react";
import { cn } from "@/lib/utils";
import { controlClasses } from "./input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, invalid, ...props }, ref) => (
  <textarea ref={ref} aria-invalid={invalid || undefined} className={cn(controlClasses, "min-h-24 py-2", className)} {...props} />
));
Textarea.displayName = "Textarea";
