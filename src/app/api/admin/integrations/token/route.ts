import { NextRequest, NextResponse } from "next/server";
import { subDays } from "date-fns";
import { getSessionClaims } from "@/lib/server/admin-session";
import { setBeeHomeTokenOverride, clearBeeHomeTokenOverride } from "@/lib/server/beehome-token";
import { callBeeHome, BeeHomeApiError, BeeHomeEndpointAlias } from "@/lib/server/beehome-client";
import { isoDate } from "@/lib/server/beehome-mappers";

/**
 * POST /api/admin/integrations/token — recebe um token colado manualmente na
 * tela de Integrações, guarda como sobrescrita (cookie httpOnly, ver
 * beehome-token.ts) e testa AO VIVO contra alguns endpoints reais da BeeHome,
 * pra sinalizar na hora se o token está funcionando ou qual falha aparece —
 * sem inventar um "conectado com sucesso" genérico.
 */

interface HealthCheck {
  alias: BeeHomeEndpointAlias;
  label: string;
  params: Record<string, unknown>;
}

function healthChecks(): HealthCheck[] {
  const to = isoDate(new Date());
  const from = isoDate(subDays(new Date(), 6));
  return [
    { alias: "peopleToday", label: "Pessoas hoje", params: {} },
    { alias: "device", label: "Dispositivos (últimos 7 dias)", params: { startDate: from, endDate: to } },
    { alias: "auditLogins", label: "Total de logins (últimos 7 dias)", params: { startDate: from, endDate: to } },
    { alias: "newsListMostViewedNews", label: "Notícias mais vistas (últimos 7 dias)", params: { startDate: from, endDate: to } },
    { alias: "beedataBeezzLikeTop", label: "Beezz mais curtidos", params: { pageNumber: 1, pageSize: 5 } },
  ];
}

async function runHealthChecks() {
  const checks = healthChecks();
  const results = await Promise.allSettled(checks.map((c) => callBeeHome(c.alias, c.params)));
  return checks.map((c, i) => {
    const result = results[i];
    if (result.status === "fulfilled") {
      return { alias: c.alias, label: c.label, ok: true, detail: "Respondeu normalmente." };
    }
    const reason = result.reason;
    const detail =
      reason instanceof BeeHomeApiError
        ? `HTTP ${reason.status ?? "?"} — ${reason.message}`
        : reason instanceof Error
          ? reason.message
          : "Falha desconhecida ao chamar a BeeHome.";
    return { alias: c.alias, label: c.label, ok: false, detail };
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
