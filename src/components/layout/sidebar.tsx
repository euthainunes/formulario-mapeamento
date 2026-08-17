"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { NAV_ITEMS, ADMIN_SUBNAV } from "@/lib/constants";
import { LogoMark } from "@/components/brand/logo-mark";
import { usePermission } from "@/hooks/use-permission";
import { useAuthStore } from "@/store/auth.store";
import { useSidebarStore } from "@/store/sidebar.store";
import { cn } from "@/lib/utils";

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ElementType; active: boolean }) {
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  return (
    <Link
      href={href}
      onClick={() => setMobileOpen(false)}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-brand-primary/10 text-brand-primary" : "text-text-secondary hover:bg-black/5 hover:text-text-primary"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function SidebarContent() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-5">
        <LogoMark className="h-8 w-8 shrink-0" />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-text-primary">Rede Américas</p>
          <p className="text-[11px] text-text-secondary">Comunicação Interna</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 space-y-1 pb-4">
        {NAV_ITEMS.map((item) => (
          <SidebarItemGuard key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      {user && (
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-brand-secondary/20 text-brand-primary flex items-center justify-center text-xs font-semibold">
              {user.avatarInitials}
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">{user.name}</p>
              <p className="text-[11px] text-text-secondary truncate">{user.jobTitle}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarItemGuard({ item, pathname }: { item: (typeof NAV_ITEMS)[number]; pathname: string }) {
  const allowed = usePermission(item.permission);
  if (!allowed) return null;

  const isAdmin = item.href.startsWith("/administracao");
  const active = isAdmin ? pathname.startsWith("/administracao") : pathname === item.href;

  return (
    <div>
      <NavLink href={item.href} label={item.label} icon={item.icon} active={active} />
      {isAdmin && active && (
        <div className="ml-7 mt-1 space-y-0.5 border-l border-border pl-3">
          {ADMIN_SUBNAV.map((sub) => (
            <AdminSubLink key={sub.href} href={sub.href} label={sub.label} permission={sub.permission} pathname={pathname} />
          ))}
        </div>
      )}
    </div>
  );
}

function AdminSubLink({
  href,
  label,
  permission,
  pathname,
}: {
  href: string;
  label: string;
  permission: Parameters<typeof usePermission>[0];
  pathname: string;
}) {
  const allowed = usePermission(permission);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  if (!allowed) return null;
  const active = pathname === href;
  return (
    <Link
      href={href}
      onClick={() => setMobileOpen(false)}
      className={cn(
        "block rounded-md px-2 py-1.5 text-xs transition-colors",
        active ? "text-brand-primary font-medium" : "text-text-secondary hover:text-text-primary"
      )}
    >
      {label}
    </Link>
  );
}

export function Sidebar() {
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);

  return (
    <>
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-surface">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-surface shadow-xl">
            <div className="flex justify-end p-2">
              <button onClick={() => setMobileOpen(false)} className="p-2 text-text-secondary" aria-label="Fechar menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
