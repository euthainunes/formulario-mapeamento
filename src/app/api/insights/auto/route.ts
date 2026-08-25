import { NextRequest, NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";
import { gatherInsightsFactsheet } from "@/lib/server/insights-data";
import { generateAutoInsights } from "@/lib/server/ai-insights";
import { parseDateRange } from "@/lib/server/beehome-mappers";
import { InsightSummary } from "@/types/insight";

/**
 * GET /api/insights/auto — sem banco de dados: monta um boletim de dados
 * reais (ver insights-data.ts) e pede a um modelo de IA (OpenAI) pra narrar
 * observações citando de qual campo cada uma veio. Regras de "nunca
 * inventar" aplicadas em ai-insights.ts, não aqui.
 *
 * Sem OPENAI_API_KEY configurada, fica vazio (mesmo comportamento honesto
 * de antes) — a IA é opcional, não um requisito pra plataforma funcionar.
 */
export async function GET(request: NextRequest) {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json<InsightSummary[]>([]);
  }

  const range = parseDateRange(request);

  try {
    const factsheet = await gatherInsightsFactsheet(range);
    const result = await generateAutoInsights(factsheet);

    if (result.insights.length === 0) {
      const reason = result.insufficientData?.reason ?? "Dados insuficientes nas fontes conectadas para gerar observações neste período.";
      const insights: InsightSummary[] = [{ id: "insufficient-data", text: `Não foi possível gerar observações: ${reason}` }];
      return NextResponse.json(insights);
    }

    const insights: InsightSummary[] = result.insights.map((insight, index) => ({
      id: `ai-${index}`,
      text: insight.text,
    }));
    return NextResponse.json(insights);
  } catch (err) {
    console.error("Insights automáticos: falha ao gerar via IA —", err instanceof Error ? err.message : err);
    const insights: InsightSummary[] = [{ id: "ai-error", text: "Não foi possível gerar observações agora — falha ao consultar o modelo de IA." }];
    return NextResponse.json(insights);
  }
}
