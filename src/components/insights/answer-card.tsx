import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { InsightAnswer } from "@/types/insight";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AnswerCard({ answer }: { answer: InsightAnswer }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium text-brand-primary mb-1">Pergunta</p>
      <p className="text-sm text-text-primary mb-3">{answer.question}</p>

      <p className="text-xs font-medium text-text-secondary mb-1">Resposta</p>
      <p className="text-sm text-text-primary mb-4">{answer.answer}</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs mb-4">
        <div>
          <p className="font-medium text-text-secondary mb-1">Período analisado</p>
          <p className="text-text-primary">{answer.periodAnalyzed}</p>
        </div>
        <div>
          <p className="font-medium text-text-secondary mb-1">Métricas usadas</p>
          <div className="flex flex-wrap gap-1">
            {answer.metricsUsed.map((m) => (
              <Badge key={m} tone="neutral">
                {m}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Link
        href={answer.relatedDashboardHref}
        className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline mb-3"
      >
        {answer.relatedDashboardLabel} <ArrowRight className="h-3.5 w-3.5" />
      </Link>

      <div className="flex items-start gap-2 rounded-lg border border-warning/25 bg-warning/5 p-2.5 text-xs text-text-secondary">
        <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
        <p>{answer.limitation}</p>
      </div>
    </Card>
  );
}
