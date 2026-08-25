"use client";

import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { SectionCard } from "@/components/shared/section-card";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { AlertRuleList } from "@/components/alerts/alert-rule-list";
import { AlertList } from "@/components/alerts/alert-list";
import { useAlertRules, useAlerts } from "@/hooks/use-alerts";
import { appConfig } from "@/lib/app-config";

export default function AdminAlertasPage() {
  const rules = useAlertRules();
  const alerts = useAlerts();
  const isMock = appConfig.dataSource === "mock";

  return (
    <RouteGuard permission="alert.manage">
      <PageHeader
        title="Administração — Alertas"
        description={
          isMock
            ? "Regras de alerta e histórico de alertas gerados."
            : "Regras de alerta e histórico de alertas gerados — exige banco de dados para salvar, que esta versão não tem."
        }
      />
      <AdminNav />

      <div className="space-y-5">
        <SectionCard title="Regras de alerta" description="Configure as condições que geram alertas automáticos.">
          <StateWrapper
            isLoading={rules.isLoading}
            isError={rules.isError}
            isEmpty={!rules.data || rules.data.length === 0}
            emptyMessage={isMock ? undefined : "Sem regras: sem banco de dados, não há como salvar uma regra nova nesta versão."}
          >
            {rules.data && <AlertRuleList rules={rules.data} />}
          </StateWrapper>
        </SectionCard>

        <SectionCard title="Alertas gerados" description="Altere o status de cada alerta conforme a triagem for feita.">
          <StateWrapper
            isLoading={alerts.isLoading}
            isError={alerts.isError}
            isEmpty={!alerts.data || alerts.data.length === 0}
            emptyMessage={isMock ? undefined : "Sem alertas: não há motor de alerta configurável nesta versão sem banco de dados."}
          >
            {alerts.data && <AlertList alerts={alerts.data} />}
          </StateWrapper>
        </SectionCard>
      </div>
    </RouteGuard>
  );
}
