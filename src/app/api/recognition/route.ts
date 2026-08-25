import { NextRequest, NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";
import { callBeeHome, BeeHomeApiError } from "@/lib/server/beehome-client";
import { toNumber, asList } from "@/lib/server/beehome-mappers";
import { RecognitionData } from "@/services/contracts/recognition.contract";
import { Collaborator } from "@/types/user";
import { KpiCard } from "@/types/metrics";
import { initialsFromName } from "@/lib/utils";

/**
 * GET /api/recognition — sem banco de dados, direto na BeeHome.
 * `birthdaysThisMonth` vem de `awardListAdmissionAwardByMonth` (aniversário
 * de ADMISSÃO/tempo de empresa — é o que esse endpoint documenta, não data
 * de nascimento; a BeeHome não expõe data de nascimento em nenhum endpoint
 * catalogado). Campos de `Collaborator` que esse endpoint não fornece
 * (device, email, skills etc.) ficam com valor neutro — não são exibidos
 * nesta tela, só existem para satisfazer o tipo. `allPeople` fica vazio:
 * precisaria do diretório completo, cujo endpoint tem path não confirmado
 * (ver /api/directory).
 */
export async function GET(request: NextRequest) {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const today = new Date();
  const month = Number(params.get("month") ?? today.getMonth() + 1);
  const year = Number(params.get("year") ?? today.getFullYear());

  const result = await callBeeHome("awardListAdmissionAwardByMonth", { today: `${year}-${String(month).padStart(2, "0")}-01`, first: 0, pageSize: 100 }).catch(
    (err: unknown) => {
      console.error("Reconhecimento: falha ao consultar BeeHome —", err instanceof BeeHomeApiError ? err.message : String(err));
      return null;
    },
  );

  const rows = result ? asList(result) : [];
  const birthdaysThisMonth: Collaborator[] = rows
    .map((row, index) => {
      const name = String(row.userName ?? row.name ?? "");
      if (!name) return null;
      const admissionDate = String(row.admission ?? row.admissionDate ?? "");
      const collaborator: Collaborator = {
        id: String(row.id ?? index),
        name,
        avatarInitials: initialsFromName(name),
        company: "",
        department: "",
        jobTitle: "",
        group: "",
        team: "",
        device: "desktop",
        lastActivity: "",
        admissionDate,
        birthDate: "",
        email: "",
        skills: [],
        active: true,
      };
      return collaborator;
    })
    .filter((c): c is Collaborator => c !== null);

  const tenureYears = rows.map((row) => toNumber(row.years ?? row.tenureYears ?? row["anosDeEmpresa"])).filter((y) => y > 0);
  const avgTenureMonths = tenureYears.length > 0 ? Math.round((tenureYears.reduce((s, y) => s + y, 0) / tenureYears.length) * 12) : 0;

  const kpis: KpiCard[] = [
    { id: "birthdays", label: "Aniversariantes do mês", value: birthdaysThisMonth.length, variation: { current: birthdaysThisMonth.length, previous: birthdaysThisMonth.length, comparable: false, percentChange: null, direction: "none" } },
    { id: "avg-tenure", label: "Tempo médio de empresa (meses)", value: avgTenureMonths, variation: { current: avgTenureMonths, previous: avgTenureMonths, comparable: false, percentChange: null, direction: "none" } },
  ];

  const data: RecognitionData = { kpis, birthdaysThisMonth, allPeople: [], partialCoverage: !result };

  return NextResponse.json(data);
}
