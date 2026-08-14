"use client";

import { ColumnDef } from "@tanstack/react-table";
import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { TeamNav } from "@/components/team-management/team-nav";
import { useTeamDocuments } from "@/hooks/use-team-documents";
import { formatDate, formatPercent } from "@/lib/formatters";
import { TeamDocument } from "@/types/team-management";

type DocumentRow = TeamDocument & { campaignName?: string };

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function GestaoDoTimeDocumentosPage() {
  const { data, isLoading, isError } = useTeamDocuments();

  const columns: ColumnDef<DocumentRow, unknown>[] = [
    { accessorKey: "name", header: "Nome", cell: ({ row }) => <span className="font-medium truncate block max-w-xs" title={row.original.name}>{row.original.name}</span> },
    { accessorKey: "campaignName", header: "Campanha", cell: ({ row }) => row.original.campaignName ?? "—" },
    { accessorKey: "mimeType", header: "Tipo", cell: ({ row }) => row.original.mimeType.split("/").pop() },
    { accessorKey: "sizeBytes", header: "Tamanho", cell: ({ row }) => formatSize(row.original.sizeBytes) },
    { accessorKey: "lastModifiedDateTime", header: "Última modificação", cell: ({ row }) => formatDate(row.original.lastModifiedDateTime) },
    { accessorKey: "lastModifiedByName", header: "Autor" },
    {
      id: "stale",
      header: "Status",
      cell: ({ row }) => (row.original.isStale ? <Badge tone="warning">Desatualizado</Badge> : <Badge tone="success">Atualizado</Badge>),
    },
  ];

  return (
    <RouteGuard permission="team-management.view">
      <PageHeader title="Gestão do Time — Documentos" description="Documentos do SharePoint simulado vinculados às campanhas de Comunicação Interna." />
      <TeamNav />

      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mb-5">
          <div className="rounded-card border border-border bg-surface p-4">
            <p className="text-xs text-text-secondary">Cobertura documental</p>
            <p className="text-xl font-semibold text-text-primary mt-1">{data.coverage.rate != null ? formatPercent(data.coverage.rate) : "—"}</p>
            <p className="text-[11px] text-text-secondary mt-1">
              {data.coverage.numerator} de {data.coverage.denominator} campanhas com pelo menos 1 documento
            </p>
          </div>
          <div className="rounded-card border border-border bg-surface p-4">
            <p className="text-xs text-text-secondary">Total de documentos</p>
            <p className="text-xl font-semibold text-text-primary mt-1">{data.documents.length}</p>
          </div>
          <div className="rounded-card border border-border bg-surface p-4">
            <p className="text-xs text-text-secondary">Documentos desatualizados</p>
            <p className="text-xl font-semibold text-text-primary mt-1">{data.documents.filter((d) => d.isStale).length}</p>
          </div>
        </div>
      )}

      <SectionCard title="Todos os documentos">
        <StateWrapper isLoading={isLoading} isError={isError} isEmpty={!data || data.documents.length === 0} partialCoverage={data?.partialCoverage}>
          {data && <DataTable columns={columns} data={data.documents} searchPlaceholder="Buscar documento..." pageSize={15} />}
        </StateWrapper>
      </SectionCard>
    </RouteGuard>
  );
}
