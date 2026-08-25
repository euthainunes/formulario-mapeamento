import { NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";
import { DirectoryData } from "@/services/contracts/directory.contract";

/**
 * GET /api/directory — sem banco de dados. Fica vazio nesta versão de
 * propósito: ⚠️ CONFIRMADO COM CHAMADA REAL (25/08/2026) — o endpoint
 * `directoryListUsersExport` devolve HTTP 500 no servidor da BeeHome (não é
 * mais "path não confirmado": o path está certo, o endpoint que está
 * quebrado do lado deles — reportar ao time BeeHome). Além disso, o tipo
 * `Collaborator` exige campos — como `device` — que não fazem parte do que
 * esse endpoint documenta devolver por pessoa (device é agregado em outro
 * endpoint, `/people/chart/device`, não por usuário). Mapear isso arriscaria
 * inventar dado mesmo se o endpoint voltasse a funcionar. Preencher só
 * depois que a BeeHome corrigir o 500 e o formato real puder ser validado.
 */
export async function GET() {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }

  const data: DirectoryData = { people: [], partialCoverage: true };
  return NextResponse.json(data);
}
