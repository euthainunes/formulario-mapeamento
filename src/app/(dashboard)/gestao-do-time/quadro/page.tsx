"use client";

import { useState } from "react";
import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { TeamNav } from "@/components/team-management/team-nav";
import { KanbanBoard } from "@/components/team-management/kanban-board";
import { TaskDetailModal } from "@/components/team-management/task-detail-modal";
import { useTeamBoard } from "@/hooks/use-team-board";

export default function GestaoDoTimeQuadroPage() {
  const { data, isLoading, isError } = useTeamBoard();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  return (
    <RouteGuard permission="team-management.view">
      <PageHeader
        title="Gestão do Time — Quadro"
        description="Quadro Kanban somente leitura do fluxo de Comunicação Interna, por bucket do Planner."
      />
      <TeamNav />

      <SectionCard title="Fluxo de trabalho" description="7 etapas fixas do fluxo — arraste a área horizontalmente para ver todas as colunas.">
        <StateWrapper isLoading={isLoading} isError={isError} isEmpty={!data || data.items.length === 0} partialCoverage={data?.partialCoverage}>
          {data && <KanbanBoard buckets={data.buckets} items={data.items} onSelectTask={setSelectedTaskId} />}
        </StateWrapper>
      </SectionCard>

      <TaskDetailModal taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
    </RouteGuard>
  );
}
