"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { MOCK_ACCOUNTS } from "@/mocks/users.mock";
import { ROLES } from "@/lib/permissions";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DEMO_BADGE_TEXT } from "@/lib/constants";
import { appConfig } from "@/lib/app-config";
import { ApiError } from "@/lib/client/api-fetch";

export default function LoginPage() {
  const router = useRouter();
  const { loginAs, isAuthenticated, hasHydrated } = useAuth();

  useEffect(() => {
    // Espera a reidratação do zustand/persist antes de decidir: sem isso,
    // `isAuthenticated` começa falso em toda carga de página (mesmo com uma
    // sessão válida no localStorage), e nunca redirecionaria de volta quando
    // apropriado nem evitaria mostrar a tela de login por um instante à toa.
    if (hasHydrated && isAuthenticated) router.replace("/");
  }, [hasHydrated, isAuthenticated, router]);

  function handleLogin(id: string) {
    loginAs(id);
    router.push("/");
  }

  if (appConfig.dataSource === "api") {
    return <ApiLoginForm onSuccess={() => router.push("/")} />;
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

/** Formulário de login real (modo `NEXT_PUBLIC_APP_MODE=api`): chama POST /api/auth/login (BFF), que autentica contra o backend NestJS e seta o cookie httpOnly de sessão — o front nunca vê o token. */
function ApiLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { loginWithCredentials } = useAuth();
  const [tenantSlug, setTenantSlug] = useState(process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithCredentials(tenantSlug.trim(), email.trim(), password);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível entrar. Verifique as credenciais e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-brand-primary flex items-center justify-center text-white text-xl font-bold mb-3">
            B
          </div>
          <h1 className="text-lg font-semibold text-text-primary">Gestão da Comunicação</h1>
          <p className="text-sm text-text-secondary">Inteligência da Intranet BeeHome</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-card border border-border bg-surface p-5 shadow-sm space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1" htmlFor="tenantSlug">
              Tenant
            </label>
            <Input
              id="tenantSlug"
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              placeholder="beehome-brasil"
              required
              autoComplete="organization"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1" htmlFor="email">
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@empresa.com.br"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1" htmlFor="password">
              Senha
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-xs text-error">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
