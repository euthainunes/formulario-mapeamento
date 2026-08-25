import { NextRequest, NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";
import { gatherInsightsFactsheet } from "@/lib/server/insights-data";
import { answerQuestion } from "@/lib/server/ai-insights";
import { parseDateRange, isoDate } from "@/lib/server/beehome-mappers";
import { InsightAnswer } from "@/types/insight";

/**
 * POST /api/insights/ask — sem banco de dados: monta o mesmo boletim de
 * dados reais de insights/auto e pede à IA pra responder SÓ com base nele.
 * Regras de "nunca inventar" aplicadas em ai-insights.ts.
 *
 * Sem OPENAI_API_KEY configurada, devolve o mesmo `{answer:null,message}`
 * de antes — não fabrica resposta.
 */
export async function POST(request: NextRequest) {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json({ statusCode: 400, message: "Informe uma pergunta." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      answer: null,
      message: "Perguntas em linguagem natural ainda não estão disponíveis nesta versão (sem modelo de IA configurado).",
    });
  }

  const range = parseDateRange(request);
  const periodAnalyzed = `${isoDate(new Date(range.from))} a ${isoDate(new Date(range.to))}`;

  try {
    const factsheet = await gatherInsightsFactsheet(range);
    const result = await answerQuestion(question, factsheet);

    if (result.answer === null) {
      const reason = result.insufficientData?.reason ?? "Dados insuficientes nas fontes conectadas para responder essa pergunta.";
      const missing = result.insufficientData?.missingFields?.length ? ` Dados necessários: ${result.insufficientData.missingFields.join(", ")}.` : "";
      return NextResponse.json({ answer: null, message: `Não foi possível calcular. Motivo: ${reason}${missing}` });
    }

    const answer: InsightAnswer = {
      id: `ai-${Date.now()}`,
      question,
      keywords: [],
      answer: result.answer,
      periodAnalyzed,
      metricsUsed: result.sourceFields,
      relatedDashboardHref: "/",
      relatedDashboardLabel: "Dashboard Executivo",
      limitation:
        result.calculation ??
        "Resposta gerada em tempo real a partir dos dados conectados no momento da pergunta, sem histórico armazenado entre consultas.",
    };
    return NextResponse.json(answer);
  } catch (err) {
    console.error("Insights (pergunta): falha ao consultar IA —", err instanceof Error ? err.message : err);
    return NextResponse.json({ answer: null, message: "Não foi possível calcular. Motivo: falha ao consultar o modelo de IA no momento." });
  }
}
