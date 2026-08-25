import { NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";

/** GET /api/reports/[id]/status — sem banco de dados, não há relatório persistido para consultar. */
export async function GET() {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }
  return NextResponse.json({ statusCode: 404, message: "Relatório não encontrado — geração de relatórios está indisponível sem banco de dados nesta versão." }, { status: 404 });
}
