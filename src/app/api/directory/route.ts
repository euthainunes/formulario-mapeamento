import { NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";
import { DirectoryData } from "@/services/contracts/directory.contract";

/**
 * GET /api/directory — sem banco de dados. Fica vazio nesta versão de
 * propósito: o endpoint de diretório da BeeHome (directoryListUsersExport)
 * tem o path exato NÃO confirmado no documento oficial (quebra de página
 * no PDF), e o tipo `Collaborator` exige campos — como `device` — que não
 * fazem parte do que esse endpoint documenta devolver por pessoa (device é
 * agregado em outro endpoint, `/people/chart/device`, não por usuário).
 * Mapear isso arriscaria inventar dado. Preencher só depois de validar uma
 * chamada real com o time BeeHome.
 */
export async function GET() {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }

  const data: DirectoryData = { people: [], partialCoverage: true };
  return NextResponse.json(data);
}
