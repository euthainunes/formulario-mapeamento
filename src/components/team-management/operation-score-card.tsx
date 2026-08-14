"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OperationScoreBreakdown } from "@/types/team-management";
import { cn } from "@/lib/utils";

const LABEL_TONE = {
  Saudável: "success",
  Atenção: "warning",
  Crítico: "critical",
} as const;

export function OperationScoreCard({ score }: { score: OperationScoreBreakdown }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-1">
          <div>
            <p className="text-xs font-medium text-text-secondary mb-1">Score operacional</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold text-text-primary">{score.overallScore}</span>
              <span className="text-sm text-text-secondary">/ 100</span>
            </div>
          </div>
          <Badge tone={LABEL_TONE[score.label]} className="text-sm px-3 py-1">
            {score.label}
          </Badge>
        </div>
        <p className="text-xs text-text-secondary mb-4">
          Combinação ponderada de 7 dimensões operacionais (pesos provisórios, a calibrar). Toque em cada dimensão para ver os sinais que explicam o score.
        </p>

        <div className="space-y-1.5">
          {score.dimensions.map((dim) => {
            const isOpen = expanded === dim.key;
            return (
              <div key={dim.key} className="rounded-lg border border-border">
                <button
                  onClick={() => setExpanded(isOpen ? null : dim.key)}
                  className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-text-primary">{dim.label}</span>
                      <span className="text-sm font-semibold text-text-primary">{dim.score}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-black/5 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", dim.score >= 80 ? "bg-success" : dim.score >= 60 ? "bg-warning" : "bg-error")}
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-text-secondary shrink-0 transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="px-3.5 pb-3.5 pt-0.5">
                    <p className="text-xs text-text-secondary mb-2">{dim.explanation}</p>
                    <p className="text-[11px] text-text-secondary mb-1.5">Peso no score geral: {Math.round(dim.weight * 100)}%</p>
                    <ul className="space-y-1">
                      {dim.signals.map((signal, idx) => (
                        <li key={idx} className="text-xs text-text-primary flex items-start gap-1.5">
                          <span className="text-text-secondary">•</span>
                          {signal}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
