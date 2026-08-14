"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { DataTable } from "@/components/tables/data-table";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TeamNav } from "@/components/team-management/team-nav";
import { AvatarGroup } from "@/components/team-management/avatar-group";
import { CriticalityBadge } from "@/components/team-management/campaign-badge";
import { TaskRiskBadges } from "@/components/team-management/risk-badges";
import { TaskDetailModal } from "@/components/team-management/task-detail-modal";
import { useTeamTaskList } from "@/hooks/use-team-tasks";
import { TeamTaskViewItem } from "@/services/contracts/team-management.contract";
import { TASK_PRIORITY_LABELS, TeamTaskPriority, TEAM_BUCKET_NAMES } from "@/types/team-management";
import { formatDate } from "@/lib/formatters";

const ALL = "__all__";

export default function GestaoDoTimeTarefasPage() {
  const { data, isLoading, isError } = useTeamTaskList();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [campaignFilter, setCampaignFilter] = useState(ALL);
  const [assigneeFilter, setAssigneeFilter] = useState(ALL);
  const [bucketFilter, setBucketFilter] = useState(ALL);
  const [priorityFilter, setPriorityFilter] = useState(ALL);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.items.filter((item) => {
      if (campaignFilter !== ALL && item.campaignId !== campaignFilter) return false;
      if (assigneeFilter !== ALL && !item.task.assigneeNames.includes(assigneeFilter)) return false;
      if (bucketFilter !== ALL && item.bucketName !== bucketFilter) return false;
      if (priorityFilter !== ALL && String(item.task.priority) !== priorityFilter) return false;
      return true;
    });
  }, [data, campaignFilter, assigneeFilter, bucketFilter, priorityFilter]);

  const columns: ColumnDef<TeamTaskViewItem, unknown>[] = [
    { accessorKey: "task.title", header: "Título", cell: ({ row }) => <span className="font-medium">{row.original.task.title}</span> },
    { accessorKey: "campaignName", header: "Campanha" },
    {
      id: "assignees",
      header: "Responsável(is)",
      cell: ({ row }) => <AvatarGroup names={row.original.task.assigneeNames} />,
    },
    { accessorKey: "bucketName", header: "Status" },
    {
      accessorKey: "task.dueDateTime",
      header: "Prazo",
      cell: ({ row }) => (row.original.task.dueDateTime ? formatDate(row.original.task.dueDateTime) : "—"),
    },
    {
      accessorKey: "task.priority",
      header: "Prioridade",
      cell: ({ row }) => <Badge tone="neutral">{TASK_PRIORITY_LABELS[row.original.task.priority]}</Badge>,
    },
    {
      id: "criticality",
      header: "Criticidade da campanha",
      cell: ({ row }) => <CriticalityBadge criticality={row.original.campaignCriticality} />,
    },
    {
      id: "risk",
      header: "Risco",
      cell: ({ row }) => <TaskRiskBadges risk={row.original.risk} />,
    },
    {
      id: "open",
      header: "",
      cell: ({ row }) => (
        <button onClick={() => setSelectedTaskId(row.original.task.id)} className="text-xs font-medium text-brand-primary hover:underline">
          Ver detalhe
        </button>
      ),
    },
  ];

  return (
    <RouteGuard permission="team-management.view">
      <PageHeader title="Gestão do Time — Tarefas" description="Lista priorizada de tarefas do Planner de Comunicação Interna, com filtros locais." />
      <TeamNav />

      <SectionCard title="Filtros">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Select value={campaignFilter} onChange={(e) => setCampaignFilter(e.target.value)}>
            <option value={ALL}>Todas as campanhas</option>
            {data?.campaignOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
            <option value={ALL}>Todos os responsáveis</option>
            {data?.assigneeOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
          <Select value={bucketFilter} onChange={(e) => setBucketFilter(e.target.value)}>
            <option value={ALL}>Todos os status</option>
            {TEAM_BUCKET_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
          <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value={ALL}>Todas as prioridades</option>
            {(Object.keys(TASK_PRIORITY_LABELS) as unknown as TeamTaskPriority[]).map((p) => (
              <option key={p} value={String(p)}>
                {TASK_PRIORITY_LABELS[p]}
              </option>
            ))}
          </Select>
        </div>
      </SectionCard>

      <div className="mt-5">
        <SectionCard title={`Tarefas (${filtered.length})`}>
          <StateWrapper isLoading={isLoading} isError={isError} isEmpty={!data || filtered.length === 0} partialCoverage={data?.partialCoverage}>
            <DataTable columns={columns} data={filtered} searchPlaceholder="Buscar tarefa..." pageSize={15} />
          </StateWrapper>
        </SectionCard>
      </div>

      <TaskDetailModal taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
    </RouteGuard>
  );
}
