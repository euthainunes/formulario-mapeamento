import { NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";
import { ReportHistoryItem } from "@/types/report";

const NO_DB_MESSAGE =
  "Geração de relatórios com histórico e download posterior exige banco de dados — essa versão roda sem persistência. Disponível novamente quando o banco for reativado.";

/** GET /api/reports — sem banco de dados, não há histórico de relatórios gerados para listar. */
export async function GET() {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }
  const history: ReportHistoryItem[] = [];
  return NextResponse.json(history);
}

/** POST /api/reports — não implementado sem banco: o relatório gerado precisaria ficar salvo para ser baixado depois (rota /reports/[id]/download), em outra requisição/instância. */
export async function POST() {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }
  return NextResponse.json({ statusCode: 501, message: NO_DB_MESSAGE }, { status: 501 });
}
