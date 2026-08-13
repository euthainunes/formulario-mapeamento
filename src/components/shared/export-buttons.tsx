"use client";

import { FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/layout/can";
import { toast } from "@/components/shared/toast";

interface ExportButtonsProps {
  label?: string;
  onExport?: (format: "csv" | "excel" | "pdf") => void;
}

/**
 * Botões de exportação mockados: nenhuma exportação real acontece — apenas simulamos
 * o processamento e confirmamos com um toast, respeitando a permissão report.export.
 */
export function ExportButtons({ label = "conteúdo", onExport }: ExportButtonsProps) {
  function handleExport(format: "csv" | "excel" | "pdf") {
    onExport?.(format);
    toast(`Exportação de ${label} em ${format.toUpperCase()} gerada (simulação — ambiente demonstrativo).`, "success");
  }

  return (
    <Can permission="report.export">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
          <FileText className="h-4 w-4" /> CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
          <FileSpreadsheet className="h-4 w-4" /> Excel
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
          <FileDown className="h-4 w-4" /> PDF
        </Button>
      </div>
    </Can>
  );
}
