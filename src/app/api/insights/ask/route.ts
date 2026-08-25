import { NextRequest, NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";

/**
 * POST /api/insights/ask — sem banco de dados e sem modelo de IA
 * configurado nesta versão: sempre devolve `{ answer: null, message }`
 * (o mesmo formato que o front-end já trata como "sem resposta encontrada"
 * — ver src/services/repositories/insights.repository.ts). Não fabrica
 * uma resposta.
 */
export async function POST(request: NextRequest) {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }
  await request.json().catch(() => null);
  return NextResponse.json({
    answer: null,
    message: "Perguntas em linguagem natural ainda não estão disponíveis nesta versão (sem modelo de IA configurado).",
  });
}
