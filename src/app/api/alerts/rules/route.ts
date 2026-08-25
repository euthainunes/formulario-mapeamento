import { NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";
import { AlertRule } from "@/types/alert";

const NO_DB_MESSAGE =
  "Regras de alerta precisam ser salvas entre acessos — essa versão roda sem banco de dados. Disponível novamente quando a persistência for reativada.";

/** GET /api/alerts/rules — sem persistência, não há regra salva para listar. */
export async function GET() {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }
  const rules: AlertRule[] = [];
  return NextResponse.json(rules);
}

/** POST /api/alerts/rules — não implementado sem banco: criar uma regra exige guardá-la para uso futuro. */
export async function POST() {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }
  return NextResponse.json({ statusCode: 501, message: NO_DB_MESSAGE }, { status: 501 });
}
