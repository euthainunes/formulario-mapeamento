"use client";

import { useState } from "react";
import { Send, BrainCircuit, Info } from "lucide-react";
import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QuestionList } from "@/components/insights/question-list";
import { AnswerCard } from "@/components/insights/answer-card";
import { useSuggestedQuestions, useAskInsight } from "@/hooks/use-insights";
import { InsightAnswer } from "@/types/insight";

export default function InsightsIaPage() {
  const { data: questions } = useSuggestedQuestions();
  const askInsight = useAskInsight();
  const [input, setInput] = useState("");
  const [conversation, setConversation] = useState<{ question: string; answer: InsightAnswer | null }[]>([]);

  function handleAsk(question: string) {
    if (!question.trim()) return;
    askInsight.mutate(question, {
      onSuccess: (answer) => {
        setConversation((prev) => [{ question, answer }, ...prev]);
        setInput("");
      },
    });
  }

  return (
    <RouteGuard permission="insights.view">
      <PageHeader title="Insights com IA" description="Respostas pré-definidas a partir de dados fictícios — nenhuma chamada real a modelos de IA é feita nesta versão." />

      <div className="flex items-start gap-2 rounded-lg border border-info/25 bg-info/5 p-3.5 text-xs text-text-secondary mb-5">
        <BrainCircuit className="h-4 w-4 text-info shrink-0 mt-0.5" />
        <p>
          Este módulo simula um assistente de inteligência sobre os dados da Comunicação. As respostas vêm de um
          dicionário fixo de perguntas e respostas — não há processamento de linguagem natural real nem acesso a
          dados fora deste ambiente demonstrativo.
        </p>
      </div>

      <div className="space-y-5">
        <SectionCard title="Perguntas sugeridas">
          <QuestionList questions={questions ?? []} onSelect={handleAsk} />
        </SectionCard>

        <SectionCard title="Faça sua pergunta">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(input);
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex.: Como estão os acessos este mês?"
            />
            <Button type="submit" disabled={askInsight.isPending}>
              <Send className="h-4 w-4" />
              {askInsight.isPending ? "Enviando..." : "Perguntar"}
            </Button>
          </form>
        </SectionCard>

        <div className="space-y-4">
          {conversation.map((item, idx) =>
            item.answer ? (
              <AnswerCard key={idx} answer={item.answer} />
            ) : (
              <div key={idx} className="flex items-start gap-2 rounded-lg border border-border bg-surface p-4 text-sm">
                <Info className="h-4 w-4 text-text-secondary shrink-0 mt-0.5" />
                <div>
                  <p className="text-text-primary font-medium mb-1">{item.question}</p>
                  <p className="text-text-secondary">
                    Dados insuficientes para essa pergunta nesta versão demonstrativa. Tente uma das perguntas
                    sugeridas acima.
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </RouteGuard>
  );
}
