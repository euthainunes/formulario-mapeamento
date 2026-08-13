"use client";

import { Alert, AlertStatus } from "@/types/alert";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { useUpdateAlertStatus } from "@/hooks/use-alerts";
import { useAuth } from "@/hooks/use-auth";
import { formatDateTime } from "@/lib/formatters";
import { toast } from "@/components/shared/toast";

const SEVERITY_TONE = { info: "info", warning: "warning", critical: "critical" } as const;
const STATUS_LABELS: Record<AlertStatus, string> = {
  novo: "Novo",
  em_analise: "Em análise",
  resolvido: "Resolvido",
  ignorado: "Ignorado",
};

export function AlertList({ alerts }: { alerts: Alert[] }) {
  const updateStatus = useUpdateAlertStatus();
  const { user } = useAuth();

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div key={alert.id} className="rounded-lg border border-border p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-text-primary">{alert.title}</p>
                <Badge tone={SEVERITY_TONE[alert.severity]}>{alert.severity}</Badge>
              </div>
              <p className="text-xs text-text-secondary mt-1">{alert.description}</p>
              <p className="text-xs text-text-secondary/70 mt-1">
                Regra: {alert.ruleName} · Criado em {formatDateTime(alert.createdAt)}
              </p>
            </div>
            <div className="shrink-0 w-40">
              <Select
                value={alert.status}
                onChange={(e) =>
                  updateStatus.mutate(
                    { id: alert.id, status: e.target.value as AlertStatus, changedBy: user?.name ?? "Usuário demonstrativo" },
                    { onSuccess: () => toast("Status do alerta atualizado.", "success") }
                  )
                }
              >
                {(Object.keys(STATUS_LABELS) as AlertStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {alert.history.length > 0 && (
            <div className="mt-3 border-t border-border pt-2.5 space-y-1">
              {alert.history.map((h) => (
                <p key={h.id} className="text-xs text-text-secondary">
                  <span className="font-medium text-text-primary">{formatDateTime(h.changedAt)}</span> — {h.changedBy}{" "}
                  alterou para <strong>{STATUS_LABELS[h.status]}</strong>
                  {h.note ? ` (${h.note})` : ""}
                </p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
