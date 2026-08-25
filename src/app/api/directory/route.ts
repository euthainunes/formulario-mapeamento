import { NextRequest, NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";
import { callBeeHome, BeeHomeApiError } from "@/lib/server/beehome-client";
import { DirectoryData } from "@/services/contracts/directory.contract";
import { Collaborator } from "@/types/user";
import { initialsFromName } from "@/lib/utils";

/**
 * GET /api/directory — sem banco de dados, direto na BeeHome.
 *
 * `directoryListUsersExport` (o endpoint que a tela usava tentar) devolve
 * HTTP 500, e — revisando a documentação oficial da BeeHome (PDF v2.0) —
 * esse path nem aparece listado nela. O endpoint real e documentado é
 * `directoryListUsersSkillsExportNew`, que funciona (confirmado com chamada
 * real em 25/08/2026) e devolve `{ recordsTotal, data: { list: [{ userTO: {...} }] } }`.
 *
 * Só mapeia o que está confirmado no formato real de `userTO`: id, nome
 * (fullName), e-mail, status (→ active). Cruzando essa amostra com a de
 * `beedataUserCreateBeezzTop` (mesmo formato de usuário da BeeHome, visto
 * em outro endpoint), nenhuma das duas mostra empresa/departamento/cargo/
 * time — por isso esses campos ficam vazios aqui, em vez de chutados.
 * `device` recebe um valor neutro (não é exibido em CollaboratorCard).
 */
export async function GET(request: NextRequest) {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }

  // `text` é o parâmetro de busca documentado para o módulo Directory (visto
  // no endpoint irmão /directory/admin/reports) — repassado aqui por
  // analogia; não foi confirmado com uma chamada real especificamente neste
  // endpoint. Se a BeeHome ignorar o parâmetro, a chamada continua segura
  // (Promise.catch abaixo já trata qualquer falha sem quebrar a tela).
  const search = request.nextUrl.searchParams.get("search")?.trim();
  const params = search ? { text: search } : {};

  const result = await callBeeHome("directoryListUsersSkillsExportNew", params).catch((err: unknown) => {
    console.error("Diretório: falha ao consultar BeeHome —", err instanceof BeeHomeApiError ? err.message : String(err));
    return null;
  });

  const list =
    result && typeof result === "object" && "data" in result
      ? ((result as { data?: { list?: unknown[] } }).data?.list ?? [])
      : [];

  const people: Collaborator[] = list
    .map((row, index) => {
      const userTO = row && typeof row === "object" && "userTO" in row ? (row as { userTO?: Record<string, unknown> }).userTO : null;
      if (!userTO) return null;
      const name = String(userTO.fullName ?? userTO.name ?? "").trim();
      if (!name) return null;
      const collaborator: Collaborator = {
        id: String(userTO.id ?? index),
        name,
        avatarInitials: initialsFromName(name),
        company: "",
        department: "",
        jobTitle: "",
        group: "",
        team: "",
        device: "desktop",
        lastActivity: "",
        admissionDate: "",
        birthDate: "",
        email: String(userTO.email ?? ""),
        skills: [],
        active: userTO.status === "ATIVO",
      };
      return collaborator;
    })
    .filter((c): c is Collaborator => c !== null);

  const data: DirectoryData = { people, partialCoverage: !result };
  return NextResponse.json(data);
}
