"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, Download, Loader2 } from "lucide-react";
import { DataTable } from "@/components/tables/data-table";
import { ReportPreview } from "@/components/reports/report-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReportHistoryItem, ReportStatus } from "@/types/report";
import { formatDateTime } from "@/lib/formatters";
import { toast } from "@/components/shared/toast";

const STATUS_TONE: Record<ReportStatus, "info" | "success" | "error"> = {
  processando: "info",
  concluido: "success",
  falha: "error",
};

const STATUS_LABEL: Record<ReportStatus, string> = {
  processando: "Processando",
  concluido: "Concluído",
  falha: "Falha",
};

/** Botão de download da linha do histórico. Em modo `api`, `item.downloadUrl` aponta para o Route Handler que serve o arquivo real (CSV/Excel/PDF) gerado pelo backend; em modo mock permanece um download simulado (toast), sem gerar arquivo de verdade. */
function DownloadAction({ item }: { item: ReportHistoryItem }) {
  const disabled = item.status !== "concluido";

  if (item.downloadUrl) {
    return (
      <a
        href={item.downloadUrl}
        title="Baixar relatório"
        aria-disabled={disabled}
        className={`inline-flex items-center justify-center rounded-lg p-1.5 text-text-primary transition-colors hover:bg-black/5 ${
          disabled ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <Download className="h-4 w-4" />
      </a>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={disabled}
      onClick={() => toast(`Download simulado de "${item.name}" (ambiente demonstrativo).`, "success")}
      title="Baixar (simulado)"
    >
      <Download className="h-4 w-4" />
    </Button>
  );
}

export function ReportHistoryTable({ items }: { items: ReportHistoryItem[] }) {
  const [preview, setPreview] = useState<ReportHistoryItem | null>(null);

  const columns: ColumnDef<ReportHistoryItem, unknown>[] = [
    { accessorKey: "name", header: "Nome" },
    { accessorKey: "type", header: "Tipo" },
    { accessorKey: "format", header: "Formato", cell: ({ row }) => row.original.format.toUpperCase() },
    { accessorKey: "createdBy", header: "Criado por" },
    { accessorKey: "createdAt", header: "Data", cell: ({ row }) => formatDateTime(row.original.createdAt) },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge tone={STATUS_TONE[status]}>
            {status === "processando" && <Loader2 className="h-3 w-3 animate-spin" />}
            {STATUS_LABEL[status]}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={() => setPreview(row.original)} title="Ver detalhes">
            <Eye className="h-4 w-4" />
          </Button>
          <DownloadAction item={row.original} />
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={items} searchPlaceholder="Buscar relatório..." />
      <ReportPreview report={preview} onClose={() => setPreview(null)} />
    </>
  );
}
