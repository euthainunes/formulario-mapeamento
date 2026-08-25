import { NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";
import { callBeeHome, BeeHomeApiError } from "@/lib/server/beehome-client";
import { IntegrationStatus } from "@/types/admin";

/**
 * GET /api/admin/integrations — sem banco de dados: em vez de reportar o
 * status da ÚLTIMA sincronização persistida (não existe mais), faz uma
 * checagem real e ao vivo contra a BeeHome (endpoint leve, sem side
 * effect) a cada carregamento da tela.
 */
export async function GET() {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente." }, { status: 401 });
  }

  let beeHomeConnected = false;
  let beeHomeStatusLabel = "Não verificado";
  try {
    await callBeeHome("peopleToday", {});
    beeHomeConnected = true;
    beeHomeStatusLabel = `Conectado — verificado agora (${new Date().toLocaleString("pt-BR")})`;
  } catch (err) {
    beeHomeStatusLabel =
      err instanceof BeeHomeApiError
        ? `Não conectado — ${err.message}`
        : "Não conectado — falha ao alcançar a BeeHome (rede ou credencial)";
  }

  const integrations: IntegrationStatus[] = [
    {
      id: "beehome",
      name: "Intranet BeeHome",
      connected: beeHomeConnected,
      statusLabel: beeHomeStatusLabel,
      description: "Consulta em tempo real aos endpoints documentados da Intranet BeeHome (sem sincronização/armazenamento próprio).",
    },
    {
      id: "microsoft-planner",
      name: "Microsoft Planner",
      connected: false,
      statusLabel: "Não conectado",
      description: "Integração futura — sem endpoints documentados ainda, nenhum conector implementado.",
    },
    {
      id: "microsoft-teams",
      name: "Microsoft Teams",
      connected: false,
      statusLabel: "Não conectado",
      description: "Integração futura — sem endpoints documentados ainda.",
    },
    {
      id: "outlook",
      name: "Outlook",
      connected: false,
      statusLabel: "Não conectado",
      description: "Integração futura — sem endpoints documentados ainda.",
    },
  ];

  return NextResponse.json(integrations);
}
