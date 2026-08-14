"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TEAM_MANAGEMENT_SUBNAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function TeamNav() {
  const pathname = usePathname();

  return (
    <div className="mb-5 flex flex-wrap gap-1 border-b border-border overflow-x-auto scrollbar-thin">
      {TEAM_MANAGEMENT_SUBNAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
              active ? "border-brand-primary text-brand-primary" : "border-transparent text-text-secondary hover:text-text-primary"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
