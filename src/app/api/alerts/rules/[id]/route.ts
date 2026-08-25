import { NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";

const NO_DB_MESSAGE =
  "Regras de alerta precisam ser salvas entre acessos — essa versão roda sem banco de dados. Disponível novamente quando a persistência for reativada.";

async function requireSession() {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }
  return null;
}

export async function PATCH() {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;
  return NextResponse.json({ statusCode: 501, message: NO_DB_MESSAGE }, { status: 501 });
}

export async function DELETE() {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;
  return NextResponse.json({ statusCode: 501, message: NO_DB_MESSAGE }, { status: 501 });
}
