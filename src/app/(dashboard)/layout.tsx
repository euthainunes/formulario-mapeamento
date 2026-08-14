"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, hasHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Só decide redirecionar depois que sabemos de verdade se há uma sessão
    // (ver hasHydrated em auth.store.ts) — antes disso, `isAuthenticated`
    // falso só significa "ainda carregando", não "sem sessão".
    if (hasHydrated && !isAuthenticated) router.replace("/login");
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm text-text-secondary">
          {hasHydrated ? "Redirecionando para o login..." : "Carregando..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <div className="lg:pl-64">
        <Topbar />
        <main className="px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
