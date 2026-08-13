import Link from "next/link";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { AlertSummary } from "@/types/alert";
import { formatDateTime } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";

const SEVERITY_ICON = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
} as const;

const SEVERITY_TONE = {
  critical: "critical",
  warning: "warning",
  info: "info",
} as const;

const SEVERITY_ICON_CLASS: Record<AlertSummary["severity"], string> = {
  critical: "text-critical",
  warning: "text-warning",
  info: "text-info",
};

export function AlertsPanel({ alerts }: { alerts: AlertSummary[] }) {
  if (alerts.length === 0) {
    return <p className="text-sm text-text-secondary py-4 text-center">Nenhum alerta prioritário no momento.</p>;
  }

  return (
    <ul className="space-y-3">
      {alerts.map((alert) => {
        const Icon = SEVERITY_ICON[alert.severity];
        return (
          <li key={alert.id} className="flex items-start gap-2.5">
            <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${SEVERITY_ICON_CLASS[alert.severity]}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-text-primary">{alert.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge tone={SEVERITY_TONE[alert.severity]}>{alert.severity}</Badge>
                <span className="text-xs text-text-secondary">{formatDateTime(alert.createdAt)}</span>
              </div>
            </div>
          </li>
        );
      })}
      <li>
        <Link href="/administracao/alertas" className="text-xs font-medium text-brand-primary hover:underline">
          Ver todos os alertas
        </Link>
      </li>
    </ul>
  );
}
