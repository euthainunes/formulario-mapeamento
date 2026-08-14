import { Badge } from "@/components/ui/badge";
import { CampaignCriticality } from "@/types/team-management";

const CRITICALITY_TONE: Record<CampaignCriticality, "neutral" | "info" | "warning" | "critical"> = {
  baixa: "neutral",
  media: "info",
  alta: "warning",
  critica: "critical",
};

export const CRITICALITY_LABEL: Record<CampaignCriticality, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

export function CampaignBadge({ name, criticality }: { name: string; criticality?: CampaignCriticality }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-xs text-text-primary font-medium truncate max-w-[10rem]" title={name}>
        {name}
      </span>
      {criticality && <Badge tone={CRITICALITY_TONE[criticality]}>{CRITICALITY_LABEL[criticality]}</Badge>}
    </span>
  );
}

export function CriticalityBadge({ criticality }: { criticality: CampaignCriticality }) {
  return <Badge tone={CRITICALITY_TONE[criticality]}>{CRITICALITY_LABEL[criticality]}</Badge>;
}
