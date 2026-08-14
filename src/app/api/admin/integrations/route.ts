import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/server/auth-cookie";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:3001";

/**
 * GET /api/admin/integrations — não existe um endpoint de "integrações" no
 * backend (a spec documenta apenas o conector BeeHome, sem um catálogo
 * genérico de integrações). Este handler deriva um status honesto a partir
 * de GET /sync/status (status real da última sincronização BeeHome) e
 * complementa com as integrações futuras (Microsoft Planner/Teams/Outlook),
 * que a spec explicitamente marca como bounded context sem endpoints
 * documentados ainda — reportadas aqui como não conectadas, sem inventar dado.
 */
export async function GET() {
  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente." }, { status: 401 });
  }

  let beeHomeStatus: { lastSyncAt: string | null; status: string; source: string } | null = null;
  try {
    const res = await fetch(new URL("/sync/status", BACKEND_URL), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.ok) beeHomeStatus = await res.json();
  } catch {
    // Backend fora do ar: ainda respondemos com a lista abaixo, sem status do BeeHome.
  }

  const integrations = [
    {
      id: "beehome",
      name: "Intranet BeeHome",
      connected: beeHomeStatus?.status === "sucesso" || beeHomeStatus?.status === "parcial",
      statusLabel: beeHomeStatus
        ? `Última sincronização: ${beeHomeStatus.lastSyncAt ? new Date(beeHomeStatus.lastSyncAt).toLocaleString("pt-BR") : "nunca executada"} (${beeHomeStatus.status})`
        : "Status indisponível (backend não respondeu)",
      description: "Conector oficial dos 21 endpoints documentados da Intranet BeeHome (ver BeeHomeConnector/SyncOrchestrator no backend).",
    },
    {
      id: "microsoft-planner",
      name: "Microsoft Planner",
      connected: false,
      statusLabel: "Não conectado",
      description: "Bounded context futuro no schema do backend — sem endpoints documentados ainda, nenhum conector implementado.",
    },
    {
      id: "microsoft-teams",
      name: "Microsoft Teams",
      connected: false,
      statusLabel: "Não conectado",
      description: "Bounded context futuro — sem endpoints documentados ainda.",
    },
    {
      id: "outlook",
      name: "Outlook",
      connected: false,
      statusLabel: "Não conectado",
      description: "Bounded context futuro — sem endpoints documentados ainda.",
    },
  ];

  return NextResponse.json(integrations);
}
