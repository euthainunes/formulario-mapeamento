import { ColumnDef } from "@tanstack/react-table";
import { Collaborator } from "@/types/user";
import { formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";

const DEVICE_LABELS: Record<Collaborator["device"], string> = {
  desktop: "Desktop",
  mobile: "Celular",
  tablet: "Tablet",
};

export const collaboratorColumns: ColumnDef<Collaborator, unknown>[] = [
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 shrink-0 rounded-full bg-brand-secondary/15 text-brand-primary flex items-center justify-center text-[10px] font-semibold">
          {row.original.avatarInitials}
        </div>
        <span className="font-medium">{row.original.name}</span>
      </div>
    ),
  },
  { accessorKey: "company", header: "Empresa" },
  { accessorKey: "department", header: "Departamento" },
  { accessorKey: "jobTitle", header: "Cargo" },
  { accessorKey: "team", header: "Time" },
  {
    accessorKey: "device",
    header: "Dispositivo",
    cell: ({ row }) => <Badge tone="neutral">{DEVICE_LABELS[row.original.device]}</Badge>,
  },
  {
    accessorKey: "lastActivity",
    header: "Última atividade",
    cell: ({ row }) => formatDate(row.original.lastActivity),
  },
];
