import { ColumnDef } from "@tanstack/react-table";
import { HelpCircle } from "lucide-react";
import { ContentItem, ContentType } from "@/types/content";
import { formatDate, formatNumber } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";

const TYPE_LABELS: Record<ContentType, string> = {
  noticia: "Notícia",
  video: "Vídeo",
  enquete: "Enquete",
  photobook: "Photobook",
  blog: "Blog",
  podcast: "Podcast",
};

const PERFORMANCE_TONE: Record<ContentItem["performance"], "success" | "neutral" | "warning"> = {
  acima_media: "success",
  na_media: "neutral",
  abaixo_media: "warning",
};

const PERFORMANCE_LABELS: Record<ContentItem["performance"], string> = {
  acima_media: "Acima da média",
  na_media: "Na média",
  abaixo_media: "Abaixo da média",
};

export const contentColumns: ColumnDef<ContentItem, unknown>[] = [
  { accessorKey: "title", header: "Título" },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => <Badge tone="brand">{TYPE_LABELS[row.original.type]}</Badge>,
  },
  { accessorKey: "publishedAt", header: "Publicado em", cell: ({ row }) => formatDate(row.original.publishedAt) },
  { accessorKey: "views", header: "Visualizações", cell: ({ row }) => formatNumber(row.original.views) },
  { accessorKey: "likes", header: "Curtidas", cell: ({ row }) => formatNumber(row.original.likes) },
  { accessorKey: "comments", header: "Comentários", cell: ({ row }) => formatNumber(row.original.comments) },
  {
    id: "engagementRate",
    header: () => (
      <span className="inline-flex items-center gap-1">
        Taxa de engajamento
        <Tooltip content="Aguardando aprovação de fórmula pela área responsável.">
          <HelpCircle className="h-3 w-3" />
        </Tooltip>
      </span>
    ),
    cell: () => <span className="text-text-secondary/60 italic">Indisponível</span>,
  },
  {
    accessorKey: "performance",
    header: "Desempenho",
    cell: ({ row }) => <Badge tone={PERFORMANCE_TONE[row.original.performance]}>{PERFORMANCE_LABELS[row.original.performance]}</Badge>,
  },
];
