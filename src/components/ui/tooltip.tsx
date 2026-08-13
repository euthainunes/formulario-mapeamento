"use client";

import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={cn(
            "absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-max max-w-64 rounded-lg bg-text-primary px-3 py-2 text-xs leading-snug text-white shadow-lg",
            className
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
