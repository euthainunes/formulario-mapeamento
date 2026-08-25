import { NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";

/**
 * GET /api/insights/suggested-questions — lista estática de sugestões
 * (texto de UI, não dado da BeeHome nem da IA) para guiar o que a pessoa
 * pode perguntar em /insights-ia. Ver /api/insights/ask para o motivo de
 * a resposta em si não estar disponível nesta versão sem banco.
 */
const SUGGESTED_QUESTIONS = [
  "Como está a audiência este mês comparado ao anterior?",
  "Quais os pods com maior queda de acesso?",
  "Qual conteúdo teve o melhor engajamento no período?",
  "Como está a taxa de engajamento em Beezz?",
  "Em que horário os acessos são mais concentrados?",
];

export async function GET() {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }
  return NextResponse.json(SUGGESTED_QUESTIONS);
}
