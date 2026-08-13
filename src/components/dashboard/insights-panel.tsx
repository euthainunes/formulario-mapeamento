import Link from "next/link";
import { Sparkles } from "lucide-react";
import { InsightSummary } from "@/types/insight";

export function InsightsPanel({ insights }: { insights: InsightSummary[] }) {
  if (insights.length === 0) {
    return <p className="text-sm text-text-secondary py-4 text-center">Nenhum insight automático disponível.</p>;
  }

  return (
    <ul className="space-y-3">
      {insights.map((insight) => (
        <li key={insight.id} className="flex items-start gap-2.5">
          <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-brand-primary" />
          <div className="min-w-0">
            <p className="text-sm text-text-primary">{insight.text}</p>
            {insight.relatedDashboard && (
              <Link href={insight.relatedDashboard} className="text-xs font-medium text-brand-primary hover:underline">
                Ver detalhes
              </Link>
            )}
          </div>
        </li>
      ))}
      <li>
        <Link href="/insights-ia" className="text-xs font-medium text-brand-primary hover:underline">
          Explorar Insights com IA
        </Link>
      </li>
    </ul>
  );
}
