import { NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";
import { InsightSummary } from "@/types/insight";

/**
 * GET /api/insights/auto — sem banco de dados: insights automáticos
 * dependem de comparar tendências ao longo do tempo, o que exige
 * histórico armazenado (não existe mais nesta versão). Fica vazio, de
 * propósito, em vez de inventar um insight sem base real.
 */
export async function GET() {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }
  const insights: InsightSummary[] = [];
  return NextResponse.json(insights);
}
