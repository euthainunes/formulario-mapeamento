import { NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";
import { Alert } from "@/types/alert";

/**
 * GET /api/alerts — sem banco de dados: alertas exigem uma regra
 * configurada e histórico persistido para disparar entre requisições
 * (não existe mais nesta versão). Fica vazio, de propósito.
 */
export async function GET() {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }
  const alerts: Alert[] = [];
  return NextResponse.json(alerts);
}
