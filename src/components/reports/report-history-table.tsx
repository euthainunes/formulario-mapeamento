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
          <Button
            variant="ghost"
            size="sm"
            disabled={row.original.status !== "concluido"}
            onClick={() => toast(`Download simulado de "${row.original.name}" (ambiente demonstrativo).`, "success")}
            title="Baixar (simulado)"
          >
            <Download className="h-4 w-4" />
          </Button>
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
