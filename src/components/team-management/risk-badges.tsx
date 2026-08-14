import { AlertTriangle, Clock, Lock, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TeamTaskRiskFlags } from "@/services/contracts/team-management.contract";

/**
 * Badges de risco de uma tarefa — todas calculadas a partir de datas/estado
 * do Planner (ver src/lib/team-metrics.ts taskRiskFlags), nunca relacionadas
 * a avaliação da pessoa responsável.
 */
export function TaskRiskBadges({ risk, className }: { risk: TeamTaskRiskFlags; className?: string }) {
  const badges: { key: string; label: string; tone: "critical" | "warning" | "neutral"; icon: typeof AlertTriangle }[] = [];
  if (risk.isOverdue) badges.push({ key: "overdue", label: "Atrasada", tone: "critical", icon: AlertTriangle });
  if (risk.isDueSoon) badges.push({ key: "due-soon", label: "Prazo ≤48h", tone: "warning", icon: Clock });
  if (risk.isUnassigned) badges.push({ key: "unassigned", label: "Sem responsável", tone: "warning", icon: UserX });
  if (risk.isBlocked) badges.push({ key: "blocked", label: "Bloqueada", tone: "critical", icon: Lock });
  if (risk.isStale) badges.push({ key: "stale", label: "Parada", tone: "neutral", icon: Clock });

  if (badges.length === 0) return null;

  return (
    <div className={className ?? "flex flex-wrap gap-1"}>
      {badges.map((b) => (
        <Badge key={b.key} tone={b.tone}>
          <b.icon className="h-3 w-3" />
          {b.label}
        </Badge>
      ))}
    </div>
  );
}
