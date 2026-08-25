import { NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";
import { SyncJob } from "@/types/sync";

/** GET /api/sync/jobs — sem banco de dados: não há mais job de sincronização (busca é direta, por tela, a cada carregamento). Lista sempre vazia. */
export async function GET() {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }
  const jobs: SyncJob[] = [];
  return NextResponse.json(jobs);
}
