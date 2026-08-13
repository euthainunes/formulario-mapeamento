"use client";

import { Plug, Lock } from "lucide-react";
import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useIntegrations } from "@/hooks/use-admin";

export default function IntegracoesPage() {
  const { data, isLoading, isError } = useIntegrations();

  return (
    <RouteGuard permission="admin.integrations.manage">
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </StateWrapper>
    </RouteGuard>
  );
}
