"use client";

import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { SectionCard } from "@/components/shared/section-card";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { AlertRuleList } from "@/components/alerts/alert-rule-list";
import { AlertList } from "@/components/alerts/alert-list";
import { useAlertRules, useAlerts } from "@/hooks/use-alerts";

export default function AdminAlertasPage() {
  const rules = useAlertRules();
  const alerts = useAlerts();

  return (
    <RouteGuard permission="alert.manage">
      <PageHeader title="Administração — Alertas" description="Regras de alerta e histórico de alertas gerados." />
      <AdminNav />

      <div className="space-y-5">
        <SectionCard title="Regras de alerta" description="Configure as condições que geram alertas automáticos.">
          <StateWrapper isLoading={rules.isLoading} isError={rules.isError} isEmpty={!rules.data || rules.data.length === 0}>
            {rules.data && <AlertRuleList rules={rules.data} />}
          </StateWrapper>
        </SectionCard>

        <SectionCard title="Alertas gerados" description="Altere o status de cada alerta conforme a triagem for feita.">
          <StateWrapper isLoading={alerts.isLoading} isError={alerts.isError} isEmpty={!alerts.data || alerts.data.length === 0}>
            {alerts.data && <AlertList alerts={alerts.data} />}
          </StateWrapper>
        </SectionCard>
      </div>
    </RouteGuard>
  );
}
