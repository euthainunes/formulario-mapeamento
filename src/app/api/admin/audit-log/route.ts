import { NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";
import { AuditLogEntry } from "@/types/admin";

/**
 * GET /api/admin/audit-log — sem banco de dados: não há onde persistir um
 * log de auditoria entre requisições (cada execução é isolada). Fica
 * vazio, de propósito, em vez de inventar histórico.
 */
export async function GET() {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }
  const entries: AuditLogEntry[] = [];
  return NextResponse.json(entries);
}
