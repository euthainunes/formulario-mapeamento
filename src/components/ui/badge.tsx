import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "success" | "info" | "warning" | "error" | "critical" | "brand";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-black/5 text-text-secondary",
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
  critical: "bg-critical/10 text-critical",
  brand: "bg-brand-primary/10 text-brand-primary",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
