"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_SUBNAV } from "@/lib/constants";
import { usePermission } from "@/hooks/use-permission";
import { cn } from "@/lib/utils";

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="mb-5 flex flex-wrap gap-1 border-b border-border overflow-x-auto scrollbar-thin">
      {ADMIN_SUBNAV.map((item) => (
        <AdminNavLink key={item.href} href={item.href} label={item.label} permission={item.permission} active={pathname === item.href} />
      ))}
    </div>
  );
}

function AdminNavLink({
  href,
  label,
  permission,
  active,
}: {
  href: string;
  label: string;
  permission: Parameters<typeof usePermission>[0];
  active: boolean;
}) {
  const allowed = usePermission(permission);
  if (!allowed) return null;
  return (
    <Link
      href={href}
      className={cn(
        "px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
        active ? "border-brand-primary text-brand-primary" : "border-transparent text-text-secondary hover:text-text-primary"
      )}
    >
      {label}
    </Link>
  );
}
