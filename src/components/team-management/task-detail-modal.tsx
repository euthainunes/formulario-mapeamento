"use client";

import { CheckSquare, Square, ExternalLink, History } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { AvatarGroup } from "./avatar-group";
import { TaskRiskBadges } from "./risk-badges";
import { useTeamTaskDetail } from "@/hooks/use-team-tasks";
import { TASK_PRIORITY_LABELS } from "@/types/team-management";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { taskRiskFlags } from "@/lib/team-metrics";
import { REFERENCE_TODAY } from "@/lib/date-range";

const EVENT_LABEL: Record<string, string> = {
  created: "Criada",
  status_changed: "Status alterado",
  due_date_changed: "Prazo alterado",
  assignee_changed: "Responsável alterado",
  completed: "Concluída",
  reopened: "Reaberta",
};

export function TaskDetailModal({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  const { data, isLoading } = useTeamTaskDetail(taskId);

  return (
    <Modal open={taskId != null} onClose={onClose} title={data?.task.title ?? "Detalhe da tarefa"} className="max-w-xl">
      {isLoading && <p className="text-sm text-text-secondary">Carregando...</p>}
      {data && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{data.campaignName}</Badge>
            <Badge tone="neutral">Prioridade: {TASK_PRIORITY_LABELS[data.task.priority]}</Badge>
            <Badge tone="neutral">{data.task.percentComplete}% concluído</Badge>
            <TaskRiskBadges risk={taskRiskFlags(data.task, REFERENCE_TODAY)} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-text-secondary mb-1">Responsáveis</p>
              <AvatarGroup names={data.task.assigneeNames} />
            </div>
            <div>
              <p className="text-text-secondary mb-1">Prazo</p>
              <p className="text-text-primary">{data.task.dueDateTime ? formatDate(data.task.dueDateTime) : "sem prazo definido"}</p>
            </div>
          </div>

          {data.task.isBlocked && (
            <div className="rounded-lg border border-error/25 bg-error/5 p-3 text-xs text-text-secondary">
              <p className="font-medium text-error mb-1">Bloqueada: {data.task.blockerType}</p>
              {data.task.dependencyOwner && <p>Depende de: {data.task.dependencyOwner}</p>}
              {data.task.nextAction && <p className="mt-1">Próxima ação: {data.task.nextAction}</p>}
            </div>
          )}

          {data.details && (
            <div>
              <p className="text-xs font-medium text-text-secondary mb-1.5">Descrição</p>
              <p className="text-sm text-text-primary mb-3">{data.details.description}</p>

              {data.details.checklist.length > 0 && (
                <>
                  <p className="text-xs font-medium text-text-secondary mb-1.5">Checklist</p>
                  <ul className="space-y-1 mb-3">
                    {data.details.checklist.map((item) => (
                      <li key={item.title} className="flex items-center gap-2 text-sm text-text-primary">
                        {item.isChecked ? (
                          <CheckSquare className="h-4 w-4 text-success shrink-0" />
                        ) : (
                          <Square className="h-4 w-4 text-text-secondary shrink-0" />
                        )}
                        {item.title}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {data.details.references.length > 0 && (
                <>
                  <p className="text-xs font-medium text-text-secondary mb-1.5">Referências</p>
                  <ul className="space-y-1 mb-3">
                    {data.details.references.map((ref) => (
                      <li key={ref.url}>
                        <a href={ref.url} className="inline-flex items-center gap-1 text-xs text-brand-primary hover:underline">
                          <ExternalLink className="h-3 w-3" />
                          {ref.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {data.documents.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-secondary mb-1.5">Documentos vinculados</p>
              <ul className="space-y-1">
                {data.documents.map((doc) => (
                  <li key={doc.id} className="text-xs text-text-primary truncate">
                    {doc.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.history.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-secondary mb-1.5 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" /> Histórico
              </p>
              <ul className="space-y-1.5 border-l border-border pl-3">
                {data.history.map((ev) => (
                  <li key={ev.id} className="text-xs">
                    <span className="text-text-primary font-medium">{EVENT_LABEL[ev.eventType] ?? ev.eventType}</span>
                    {ev.oldValue && ev.newValue && (
                      <span className="text-text-secondary">
                        {" "}
                        — de &quot;{ev.oldValue}&quot; para &quot;{ev.newValue}&quot;
                      </span>
                    )}
                    <span className="block text-text-secondary">{formatDateTime(ev.occurredAt)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <a
            href={data.task.sourceUrl}
            className="inline-flex items-center gap-1 text-xs text-brand-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> Abrir no Planner (link fictício)
          </a>
        </div>
      )}
    </Modal>
  );
}
