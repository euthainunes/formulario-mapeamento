import { ColumnDef } from "@tanstack/react-table";
import { BeezzPost } from "@/types/content";
import { formatDate, formatNumber } from "@/lib/formatters";

export const beezzColumns: ColumnDef<BeezzPost, unknown>[] = [
  { accessorKey: "title", header: "Título" },
  { accessorKey: "author", header: "Autor" },
  { accessorKey: "createdAt", header: "Publicado em", cell: ({ row }) => formatDate(row.original.createdAt) },
  { accessorKey: "likes", header: "Curtidas", cell: ({ row }) => formatNumber(row.original.likes) },
  { accessorKey: "comments", header: "Comentários", cell: ({ row }) => formatNumber(row.original.comments) },
];
