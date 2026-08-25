import { NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";
import { SyncStatusSnapshot } from "@/types/sync";

/**
 * GET /api/sync/status — sem banco de dados: não existe mais "sincronização"
 * (cada tela busca direto na BeeHome a cada carregamento). Devolve um
 * status neutro refletindo isso, em vez do status de um job persistido que
 * não existe.
 */
export async function GET() {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }
  const status: SyncStatusSnapshot = {
    lastSyncAt: new Date().toISOString(),
    status: "sucesso",
    source: "Intranet BeeHome (tempo real — sem sincronização/armazenamento)",
  };
  return NextResponse.json(status);
}
