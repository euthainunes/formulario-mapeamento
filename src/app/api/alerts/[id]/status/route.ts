import { NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";

/** PATCH /api/alerts/[id]/status — não implementado sem banco: não há alerta persistido para atualizar. */
export async function PATCH() {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }
  return NextResponse.json(
    { statusCode: 501, message: "Sem banco de dados nesta versão — não há alerta persistido para atualizar." },
    { status: 501 },
  );
}
