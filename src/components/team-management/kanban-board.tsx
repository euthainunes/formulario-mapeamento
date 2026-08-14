"use client";

import { FileText } from "lucide-react";
import { TeamBucket, TASK_PRIORITY_LABELS } from "@/types/team-management";
import { TeamTaskViewItem } from "@/services/contracts/team-management.contract";
import { AvatarGroup } from "./avatar-group";
import { CampaignBadge } from "./campaign-badge";
import { TaskRiskBadges } from "./risk-badges";
import { formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";

interface KanbanBoardProps {
  buckets: TeamBucket[];
  items: TeamTaskViewItem[];
  onSelectTask: (taskId: string) => void;
}

/**
 * Quadro Kanban somente leitura (sem drag-and-drop — os dados são mockados,
 * refletir movimentação exigiria estado real de um Planner de verdade).
 */
export function KanbanBoard({ buckets, items, onSelectTask }: KanbanBoardProps) {
  const sortedBuckets = [...buckets].sort((a, b) => a.orderHint - b.orderHint);

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-2">
      {sortedBuckets.map((bucket) => {
        const bucketItems = items.filter((i) => i.bucketId === bucket.id);
        return (
          <div key={bucket.id} className="w-72 shrink-0">
            <div className="flex items-center justify-between px-1 mb-2">
              <p className="text-sm font-semibold text-text-primary">{bucket.name}</p>
              <span className="text-xs text-text-secondary">{bucketItems.length}</span>
            </div>
            <div className="space-y-2 min-h-[3rem]">
              {bucketItems.map((item) => (
                <button
                  key={item.task.id}
                  onClick={() => onSelectTask(item.task.id)}
                  className="w-full text-left rounded-card border border-border bg-surface p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:border-brand-primary transition-colors"
                >
                  <p className="text-sm font-medium text-text-primary mb-1.5 line-clamp-2">{item.task.title}</p>
                  <div className="mb-1.5">
                    <CampaignBadge name={item.campaignName} />
                  </div>
                  <TaskRiskBadges risk={item.risk} className="flex flex-wrap gap-1 mb-1.5" />
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <AvatarGroup names={item.task.assigneeNames} max={2} />
                    <div className="flex items-center gap-1.5">
                      {item.hasDocument && <FileText className="h-3.5 w-3.5 text-text-secondary" />}
                      <Badge tone="neutral">{TASK_PRIORITY_LABELS[item.task.priority]}</Badge>
                    </div>
                  </div>
                  {item.task.dueDateTime && (
                    <p className="text-[11px] text-text-secondary mt-1.5">Prazo: {formatDate(item.task.dueDateTime)}</p>
                  )}
                </button>
              ))}
              {bucketItems.length === 0 && (
                <p className="text-xs text-text-secondary italic py-3 text-center">Sem tarefas</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
