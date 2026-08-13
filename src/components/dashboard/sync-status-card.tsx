import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { SyncStatusSnapshot } from "@/types/sync";
import { formatDateTime } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG = {
  sucesso: { icon: CheckCircle2, tone: "success" as const, label: "Sucesso" },
  parcial: { icon: AlertTriangle, tone: "warning" as const, label: "Parcial" },
  falha: { icon: XCircle, tone: "error" as const, label: "Falha" },
};

export function SyncStatusCard({ status }: { status: SyncStatusSnapshot }) {
  const config = STATUS_CONFIG[status.status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3">
      <Icon className={`h-8 w-8 shrink-0 ${config.tone === "success" ? "text-success" : config.tone === "warning" ? "text-warning" : "text-error"}`} />
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-text-primary">{status.source}</p>
          <Badge tone={config.tone}>{config.label}</Badge>
        </div>
        <p className="text-xs text-text-secondary mt-0.5">Simulada em {formatDateTime(status.lastSyncAt)}</p>
      </div>
    </div>
  );
}
