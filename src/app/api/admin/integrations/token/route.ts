import { NextRequest, NextResponse } from "next/server";
import { subDays } from "date-fns";
import { getSessionClaims } from "@/lib/server/admin-session";
import { setBeeHomeTokenOverride, clearBeeHomeTokenOverride } from "@/lib/server/beehome-token";
import { callBeeHome, BeeHomeApiError, BeeHomeEndpointAlias } from "@/lib/server/beehome-client";
import { isoDate } from "@/lib/server/beehome-mappers";

/**
 * POST /api/admin/integrations/token — recebe um token colado manualmente na
 * tela de Integrações, guarda como sobrescrita (cookie httpOnly, ver
 * beehome-token.ts) e testa AO VIVO contra TODOS os endpoints documentados no
 * catálogo da BeeHome (beehome-client.ts), um por um, pra sinalizar na hora
 * o que esse token realmente consegue acessar hoje — sem inventar um
 * "conectado com sucesso" genérico nem esconder o que falha.
 *
 * Os parâmetros de cada chamada seguem o mesmo padrão já usado nas rotas que
 * de fato consomem cada endpoint (ver src/app/api/*); para os que nenhuma
 * tela usa ainda, usa-se o par startDate/endDate (padrão dominante no
 * catálogo) ou nenhum parâmetro, nunca um valor inventado.
 */

interface HealthCheck {
  alias: BeeHomeEndpointAlias;
  label: string;
  params: Record<string, unknown>;
}

function healthChecks(): HealthCheck[] {
  const now = new Date();
  const to = isoDate(now);
  const from = isoDate(subDays(now, 6));
  const range = { startDate: from, endDate: to };
  const admissionMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  return [
    { alias: "peopleToday", label: "Pessoas hoje", params: {} },
    { alias: "peopleChart", label: "Gráfico de pessoas (7 dias)", params: range },
    { alias: "device", label: "Dispositivos (7 dias)", params: range },
    { alias: "peopleTable", label: "Tabela de pessoas (7 dias)", params: range },
    { alias: "reaction", label: "Reações — tipo curtida em Beezz (7 dias)", params: { type: "countBeezzLiked", ...range } },
    { alias: "auditLogins", label: "Total de logins (7 dias)", params: range },
    { alias: "auditLoginsByDate", label: "Logins por data (7 dias)", params: range },
    { alias: "auditAverageLoginsByHour", label: "Média de logins por hora (7 dias)", params: range },
    { alias: "auditAverageLoginsByDay", label: "Média de logins por dia da semana (7 dias)", params: range },
    { alias: "insightsAccessByYear", label: `Acessos no ano ${now.getFullYear()}`, params: { year: now.getFullYear() } },
    { alias: "newsListMostViewedNews", label: "Notícias mais vistas (7 dias)", params: range },
    { alias: "newsListMostLikedNews", label: "Notícias mais curtidas (7 dias)", params: range },
    { alias: "newsListMostCommentedNews", label: "Notícias mais comentadas (7 dias)", params: range },
    { alias: "newsGetPublishedNewsChart", label: "Gráfico de publicações (7 dias)", params: range },
    { alias: "beedataBeezzLikeTop", label: "Beezz mais curtidos", params: { pageNumber: 1, pageSize: 5 } },
    { alias: "beedataBeezzLikeTopCount", label: "Contagem de curtidas em Beezz", params: {} },
    { alias: "beedataBeezzCommentTop", label: "Beezz mais comentados", params: { pageNumber: 1, pageSize: 5 } },
    { alias: "beedataUserCreateBeezzTop", label: "Ranking de criadores de Beezz", params: { maxResults: 10 } },
    { alias: "auditListTimelineByDate", label: "Linha do tempo de auditoria (7 dias)", params: range },
    { alias: "auditBeezzReactions", label: "Reações em Beezz — auditoria (7 dias)", params: range },
    { alias: "directoryListUsersExport", label: "Exportação do diretório de usuários", params: {} },
    { alias: "directoryListUsersSkillsExportNew", label: "Exportação de competências do diretório", params: {} },
    { alias: "podAuditListMostAccessed", label: "Pods mais acessados (7 dias)", params: range },
    { alias: "podAuditListLeastAccessed", label: "Pods menos acessados (7 dias)", params: range },
    { alias: "awardCheck", label: "Verificação de premiação", params: {} },
    { alias: "awardUsersCheck", label: "Verificação de premiação por usuário", params: {} },
    { alias: "awardListAdmissionAwardByMonth", label: "Premiação de admissão do mês", params: { today: admissionMonthStart, first: 0, pageSize: 100 } },
  ];
}

const SAMPLE_MAX_CHARS = 800;

/** Recorta o corpo real da resposta pra caber na tela — é essa amostra que evita ter que adivinhar o formato de campos de um endpoint ainda não usado em nenhuma tela. */
function sampleOf(value: unknown): string {
  let json: string;
  try {
    json = JSON.stringify(value, null, 0);
  } catch {
    return "(não foi possível serializar a resposta)";
  }
  if (json.length <= SAMPLE_MAX_CHARS) return json;
  return `${json.slice(0, SAMPLE_MAX_CHARS)}… (${json.length} caracteres no total)`;
}

async function runHealthChecks() {
  const checks = healthChecks();
  const results = await Promise.allSettled(checks.map((c) => callBeeHome(c.alias, c.params)));
  return checks.map((c, i) => {
    const result = results[i];
    if (result.status === "fulfilled") {
      return { alias: c.alias, label: c.label, ok: true, detail: "Respondeu normalmente.", sample: sampleOf(result.value) };
    }
    const reason = result.reason;
    const detail =
      reason instanceof BeeHomeApiError
        ? `HTTP ${reason.status ?? "?"} — ${reason.message}`
        : reason instanceof Error
          ? reason.message
          : "Falha desconhecida ao chamar a BeeHome.";
    return { alias: c.alias, label: c.label, ok: false, detail, sample: null };
  });
}

export async function POST(request: NextRequest) {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (!token) {
    return NextResponse.json({ statusCode: 400, message: "Cole o token antes de testar." }, { status: 400 });
  }

  await setBeeHomeTokenOverride(token);

  const checks = await runHealthChecks();
  const anyOk = checks.some((c) => c.ok);
  const allOk = checks.every((c) => c.ok);

  // Token não autenticou em nenhuma chamada — não faz sentido manter a
  // sobrescrita ativa (voltaria a usar BEEHOME_BEARER_TOKEN, se houver).
  if (!anyOk) {
    await clearBeeHomeTokenOverride();
  }

  return NextResponse.json({
    tokenAccepted: anyOk,
    allChecksPassed: allOk,
    checkedAt: new Date().toISOString(),
    checks,
  });
}

/** DELETE /api/admin/integrations/token — remove a sobrescrita e volta a usar BEEHOME_BEARER_TOKEN (variável de ambiente), se configurada. */
export async function DELETE() {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }
  await clearBeeHomeTokenOverride();
  return NextResponse.json({ cleared: true });
}
