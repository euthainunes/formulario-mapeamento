import { ColumnDef } from "@tanstack/react-table";
import { Pod } from "@/types/content";
import { formatNumber, formatPercent } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";

const STATUS_TONE: Record<Pod["status"], "success" | "error" | "neutral"> = {
  crescimento: "success",
  queda: "error",
  estavel: "neutral",
};

const STATUS_LABEL: Record<Pod["status"], string> = {
  crescimento: "Em crescimento",
  queda: "Em queda",
  estavel: "Estável",
};

export const podColumns: ColumnDef<Pod, unknown>[] = [
  { accessorKey: "name", header: "Pod" },
  { accessorKey: "accessCount", header: "Acessos", cell: ({ row }) => formatNumber(row.original.accessCount) },
  {
    accessorKey: "participationPercent",
    header: "Participação",
    cell: ({ row }) => formatPercent(row.original.participationPercent),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge tone={STATUS_TONE[row.original.status]}>{STATUS_LABEL[row.original.status]}</Badge>,
  },
];
