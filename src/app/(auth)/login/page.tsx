"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { MOCK_ACCOUNTS } from "@/mocks/users.mock";
import { ROLES } from "@/lib/permissions";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { DEMO_BADGE_TEXT } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const { loginAs, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  function handleLogin(id: string) {
    loginAs(id);
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-brand-primary flex items-center justify-center text-white text-xl font-bold mb-3">
            B
          </div>
          <h1 className="text-lg font-semibold text-text-primary">Gestão da Comunicação</h1>
          <p className="text-sm text-text-secondary">Inteligência da Intranet BeeHome</p>
          <Badge tone="warning" className="mt-3">
            {DEMO_BADGE_TEXT}
          </Badge>
        </div>

        <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-start gap-2 mb-4 text-xs text-text-secondary bg-info/5 border border-info/20 rounded-lg p-3">
            <ShieldCheck className="h-4 w-4 text-info shrink-0 mt-0.5" />
            <p>
              Modo demonstração: escolha um usuário fictício para simular o login. Nenhuma senha é utilizada — este
              fluxo não representa um mecanismo de autenticação real.
            </p>
          </div>

          <div className="space-y-2">
            {MOCK_ACCOUNTS.map((account) => (
              <button
                key={account.id}
                onClick={() => handleLogin(account.id)}
                className="w-full flex items-center gap-3 rounded-lg border border-border px-3.5 py-2.5 text-left transition-colors hover:border-brand-primary hover:bg-brand-primary/5"
              >
                <div className="h-9 w-9 shrink-0 rounded-full bg-brand-secondary/15 text-brand-primary flex items-center justify-center text-xs font-semibold">
                  {account.avatarInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">{account.name}</p>
                  <p className="text-xs text-text-secondary truncate">
                    {ROLES[account.role].name} · {account.jobTitle}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-text-secondary shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
