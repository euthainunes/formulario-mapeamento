import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { TeamAlert } from "@/types/team-management";
import { formatDateTime } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";

const LEVEL_ICON = {
  critico: AlertTriangle,
  atencao: AlertCircle,
  informativo: Info,
} as const;

const LEVEL_TONE = {
  critico: "critical",
  atencao: "warning",
  informativo: "info",
} as const;

const LEVEL_LABEL = {
  critico: "Crítico",
  atencao: "Atenção",
  informativo: "Informativo",
} as const;

const LEVEL_ICON_CLASS: Record<TeamAlert["level"], string> = {
  critico: "text-critical",
  atencao: "text-warning",
  informativo: "text-info",
};

export function TeamAlertsPanel({ alerts }: { alerts: TeamAlert[] }) {
  if (alerts.length === 0) {
    return <p className="text-sm text-text-secondary py-4 text-center">Nenhum alerta crítico no momento.</p>;
  }

  return (
    <ul className="space-y-3">
      {alerts.map((alert) => {
        const Icon = LEVEL_ICON[alert.level];
        return (
          <li key={alert.id} className="flex items-start gap-2.5">
            <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${LEVEL_ICON_CLASS[alert.level]}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-text-primary font-medium">{alert.title}</p>
              <p className="text-xs text-text-secondary mt-0.5">{alert.description}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge tone={LEVEL_TONE[alert.level]}>{LEVEL_LABEL[alert.level]}</Badge>
                <span className="text-xs text-text-secondary">{formatDateTime(alert.detectedAt)}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
