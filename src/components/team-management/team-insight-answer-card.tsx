import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TeamInsightAnswer } from "@/services/contracts/team-management.contract";

export function TeamInsightAnswerCard({ answer }: { answer: TeamInsightAnswer }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium text-brand-primary mb-1">Pergunta</p>
      <p className="text-sm text-text-primary mb-3">{answer.question}</p>

      <p className="text-xs font-medium text-text-secondary mb-1">Conclusão</p>
      <p className="text-sm text-text-primary mb-4">{answer.conclusion}</p>

      <p className="text-xs font-medium text-text-secondary mb-1.5">Evidências</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 mb-4">
        {answer.evidence.map((e) => (
          <div key={e.label} className="rounded-lg border border-border px-3 py-2">
            <p className="text-[11px] text-text-secondary">{e.label}</p>
            <p className="text-sm text-text-primary font-medium truncate" title={e.value}>
              {e.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-warning/25 bg-warning/5 p-2.5 text-xs text-text-secondary">
        <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
        <p>{answer.confidenceNote}</p>
      </div>
    </Card>
  );
}
