"use client";

import { Plug, Lock, CheckCircle2, XCircle } from "lucide-react";
import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIntegrations } from "@/hooks/use-admin";
import { useBeeHomeTokenTest } from "@/hooks/use-beehome-token-test";
import { appConfig } from "@/lib/app-config";

export default function IntegracoesPage() {
  const { data, isLoading, isError } = useIntegrations();

  return (
    <RouteGuard permission="integration.manage">
      <PageHeader
        title="Administração — Integrações"
        description="Status das integrações externas. Nesta fase, nenhuma integração está conectada de fato."
      />
      <AdminNav />

      <StateWrapper isLoading={isLoading} isError={isError} isEmpty={!data || data.length === 0}>
        {data && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {data.map((integration) => (
              <Card key={integration.id}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Plug className="h-4 w-4 text-brand-primary" />
                      <p className="text-sm font-semibold text-text-primary">{integration.name}</p>
                    </div>
                    <Badge tone={integration.connected ? "success" : "neutral"}>{integration.statusLabel}</Badge>
                  </div>
                  <p className="text-xs text-text-secondary mb-4">{integration.description}</p>

                  {integration.id === "beehome" && appConfig.dataSource === "api" ? (
                    <BeeHomeTokenPanel />
                  ) : (
                    <div className="space-y-2 opacity-60">
                      <div>
                        <label className="block text-[11px] font-medium text-text-secondary mb-1 flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Endpoint de integração
                        </label>
                        <Input disabled placeholder="Disponível após validação técnica" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-text-secondary mb-1 flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Credencial (protegida)
                        </label>
                        <Input disabled type="password" value="••••••••••••" readOnly />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </StateWrapper>
    </RouteGuard>
  );
}

function BeeHomeTokenPanel() {
  const { token, setToken, submit, clear, isPending, isClearing, result, error } = useBeeHomeTokenTest();

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div>
        <label className="block text-[11px] font-medium text-text-secondary mb-1">
          Colar token da BeeHome (substitui o token em uso até expirar, sem precisar de novo deploy)
        </label>
        <Input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Cole aqui o token (Bearer) fornecido pela BeeHome"
          type="password"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={submit} disabled={isPending || token.trim().length === 0}>
          {isPending ? "Testando..." : "Atualizar e testar"}
        </Button>
        <Button size="sm" variant="outline" onClick={clear} disabled={isClearing}>
          Remover token manual
        </Button>
      </div>

      {error && <p className="text-xs text-error">{error}</p>}

      {result && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-text-primary">
            {result.tokenAccepted
              ? result.allChecksPassed
                ? `Token válido — todos os ${result.checks.length} endpoints testados responderam.`
                : `Token válido — ${result.checks.filter((c) => c.ok).length} de ${result.checks.length} endpoints responderam (veja abaixo quais falharam).`
              : "Token não autenticou em nenhuma verificação — sobrescrita não foi mantida."}
          </p>
          <ul className="max-h-72 overflow-y-auto scrollbar-thin space-y-1 pr-1">
            {result.checks.map((check) => (
              <li key={check.alias} className="flex items-start gap-1.5 text-xs">
                {check.ok ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-error shrink-0 mt-0.5" />
                )}
                <span>
                  <strong className="font-medium">{check.label}:</strong> {check.detail}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-text-secondary">Testado às {new Date(result.checkedAt).toLocaleTimeString("pt-BR")}</p>
        </div>
      )}
    </div>
  );
}
