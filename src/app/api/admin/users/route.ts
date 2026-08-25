import { NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";
import { AdminUser } from "@/types/admin";

/**
 * GET /api/admin/users — sem banco de dados: existe uma única conta no
 * sistema (Bruna, administradora), então a "lista de usuários" é sempre
 * esse único registro, montado a partir da sessão atual — não há tabela
 * de usuários para consultar.
 */
export async function GET() {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }

  const users: AdminUser[] = [
    {
      id: session.sub,
      name: session.name,
      email: session.email,
      role: "Administradora",
      department: "Comunicação",
      active: true,
      lastLogin: new Date().toISOString(),
    },
  ];

  return NextResponse.json(users);
}
