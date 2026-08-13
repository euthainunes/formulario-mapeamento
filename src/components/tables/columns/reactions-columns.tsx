import { ColumnDef } from "@tanstack/react-table";
import { ReactionTotal } from "@/types/content";
import { formatNumber } from "@/lib/formatters";

export const reactionColumns: ColumnDef<ReactionTotal, unknown>[] = [
  { accessorKey: "type", header: "Identificador" },
  { accessorKey: "label", header: "Tipo de reação" },
  { accessorKey: "count", header: "Total no período", cell: ({ row }) => formatNumber(row.original.count) },
];
