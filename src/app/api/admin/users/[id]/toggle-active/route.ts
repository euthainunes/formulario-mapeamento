import { NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";

/**
 * PATCH /api/admin/users/[id]/toggle-active — não se aplica: existe uma
 * única conta (a administradora logada), então não faz sentido desativá-la
 * por esta tela. Sem banco de dados para desativar de qualquer forma.
 */
export async function PATCH() {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }
  return NextResponse.json(
    { statusCode: 400, message: "Não é possível desativar a única conta administradora do sistema." },
    { status: 400 },
  );
}
