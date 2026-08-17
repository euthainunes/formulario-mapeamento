"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Loader2, Eye, EyeOff, Lock } from "lucide-react";
import { MOCK_ACCOUNTS } from "@/mocks/users.mock";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DEMO_BADGE_TEXT } from "@/lib/constants";
import { appConfig } from "@/lib/app-config";
import { ApiError } from "@/lib/client/api-fetch";
import { LogoMark } from "@/components/brand/logo-mark";

/**
 * Credenciais de demonstração desta tela — validadas só no cliente, sem
 * nenhuma chamada de rede (estamos em modo mock). Não representam um
 * mecanismo de autenticação real; existem só para dar uma experiência de
 * login/senha "de verdade" na demonstração, já que hoje só a administradora
 * (Bruna) tem conta no sistema.
 */
const DEMO_LOGIN = "12457832659";
const DEMO_PASSWORD = "redeamericas";

/** Painel de marca compartilhado pelas duas variantes de login (mock e api). */
function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex">
      <div
        className="hidden lg:flex lg:w-[42%] flex-col justify-between p-10 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #4a1554 0%, var(--brand-primary) 55%, #8a9c5e 130%)" }}
      >
        <div
          className="absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-20"
          style={{ background: "var(--brand-accent)" }}
        />
        <div
          className="absolute -left-16 bottom-10 h-56 w-56 rounded-full opacity-10"
          style={{ background: "var(--brand-secondary)" }}
        />

        <div className="relative flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-lg bg-white/90 backdrop-blur flex items-center justify-center p-1.5">
            <LogoMark className="h-full w-full" />
          </div>
          <span className="text-sm font-semibold tracking-wide">REDE AMÉRICAS</span>
        </div>

        <div className="relative space-y-4">
          <h1 className="text-3xl font-semibold leading-tight">
            Gestão da Comunicação
            <br />e Inteligência da Intranet
          </h1>
          <p className="text-sm text-white/80 max-w-sm">
            Uma visão centralizada da operação de Comunicação Interna e Endomarketing — audiência, conteúdos,
            engajamento e a gestão do time, em um só lugar.
          </p>
        </div>

        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} Rede Américas</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { loginAs, isAuthenticated, hasHydrated } = useAuth();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Espera a reidratação do zustand/persist antes de decidir: sem isso,
    // `isAuthenticated` começa falso em toda carga de página (mesmo com uma
    // sessão válida no localStorage), e nunca redirecionaria de volta quando
    // apropriado nem evitaria mostrar a tela de login por um instante à toa.
    if (hasHydrated && isAuthenticated) router.replace("/");
  }, [hasHydrated, isAuthenticated, router]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (login.trim() !== DEMO_LOGIN || password !== DEMO_PASSWORD) {
      setError("Login ou senha inválidos.");
      return;
    }

    setLoading(true);
    const bruna = MOCK_ACCOUNTS[0];
    loginAs(bruna.id);
    router.push("/");
  }

  if (appConfig.dataSource === "api") {
    return <ApiLoginForm onSuccess={() => router.push("/")} />;
  }

  return (
    <AuthShell>
      <div className="mb-6 lg:hidden flex flex-col items-center text-center">
        <div className="h-12 w-12 mb-3">
          <LogoMark className="h-full w-full" />
        </div>
        <h1 className="text-lg font-semibold text-text-primary">Rede Américas</h1>
        <p className="text-sm text-text-secondary">Comunicação Interna</p>
      </div>

      <div className="mb-5">
        <h2 className="text-xl font-semibold text-text-primary">Bem-vinda de volta</h2>
        <p className="text-sm text-text-secondary mt-1">Entre com seu login e senha para acessar o painel.</p>
        <Badge tone="warning" className="mt-3">
          {DEMO_BADGE_TEXT}
        </Badge>
      </div>

      <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-start gap-2 mb-4 text-xs text-text-secondary bg-brand-secondary/15 border border-brand-primary/15 rounded-lg p-3">
          <ShieldCheck className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
          <p>
            Ambiente demonstrativo. Use o login <strong className="text-text-primary">12457832659</strong> e a
            senha <strong className="text-text-primary">redeamericas</strong> para entrar como administradora.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1" htmlFor="login">
              Login
            </label>
            <Input
              id="login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Seu login"
              required
              autoComplete="username"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1" htmlFor="password">
              Senha
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
                autoComplete="current-password"
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-error">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Entrar
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}

/** Formulário de login real (modo `NEXT_PUBLIC_APP_MODE=api`): chama POST /api/auth/login (BFF), que autentica contra o backend NestJS e seta o cookie httpOnly de sessão — o front nunca vê o token. */
function ApiLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { loginWithCredentials } = useAuth();
  const [tenantSlug, setTenantSlug] = useState(process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <AuthShell>
      <div className="mb-6 lg:hidden flex flex-col items-center text-center">
        <div className="h-12 w-12 mb-3">
          <LogoMark className="h-full w-full" />
        </div>
        <h1 className="text-lg font-semibold text-text-primary">Rede Américas</h1>
        <p className="text-sm text-text-secondary">Comunicação Interna</p>
      </div>

      <div className="mb-5">
        <h2 className="text-xl font-semibold text-text-primary">Bem-vinda de volta</h2>
        <p className="text-sm text-text-secondary mt-1">Entre com seu e-mail e senha para acessar o painel.</p>
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
            placeholder="rede-americas"
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
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="pr-9"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-error">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Entrar
        </Button>
      </form>
    </AuthShell>
  );
}
