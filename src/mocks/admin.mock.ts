import { AdminUser, AuditLogEntry, IntegrationStatus } from "@/types/admin";
import { REFERENCE_TODAY } from "@/lib/date-range";
import { MOCK_ACCOUNTS } from "./users.mock";
import { ROLES } from "@/lib/permissions";

function daysAgoIso(d: number): string {
  const date = new Date(REFERENCE_TODAY);
  date.setDate(date.getDate() - d);
  return date.toISOString();
}

export const MOCK_ADMIN_USERS: AdminUser[] = MOCK_ACCOUNTS.map((acc, idx) => ({
  id: acc.id,
  name: acc.name,
  email: acc.email,
  role: ROLES[acc.role].name,
  department: acc.department,
  active: true,
  lastLogin: daysAgoIso(idx + 1),
}));

export const MOCK_AUDIT_LOG: AuditLogEntry[] = [
  { id: "audit-1", actor: "Bruna de Carvalho", action: "Gerou relatório", target: "Relatório de Audiência — Departamento Comunicação", timestamp: daysAgoIso(6) },
  { id: "audit-2", actor: "Bruna de Carvalho", action: "Atualizou regra de alerta", target: "Queda de acessos diários", timestamp: daysAgoIso(9) },
  { id: "audit-3", actor: "Sistema", action: "Sincronização concluída com falha simulada", target: "Intranet BeeHome", timestamp: daysAgoIso(3) },
  { id: "audit-4", actor: "Bruna de Carvalho", action: "Alterou status de alerta", target: "Queda de utilização — Pod Financeiro", timestamp: daysAgoIso(11) },
  { id: "audit-5", actor: "Bruna de Carvalho", action: "Alterou perfil de permissão", target: "Gestão de Comunicação", timestamp: daysAgoIso(30) },
  { id: "audit-6", actor: "Bruna de Carvalho", action: "Exportou relatório", target: "Relatório Executivo — Julho 2026", timestamp: daysAgoIso(14) },
  { id: "audit-7", actor: "Sistema", action: "Alerta gerado automaticamente", target: "Queda de 18% nos acessos da última semana", timestamp: daysAgoIso(1) },
];

export const MOCK_INTEGRATIONS: IntegrationStatus[] = [
  {
    id: "beehome",
    name: "Intranet BeeHome",
    connected: false,
    statusLabel: "Não conectado — aguardando validação técnica",
    description: "Fonte primária de dados de audiência, acessos, conteúdos, Beezz e engajamento.",
  },
  {
    id: "planner",
    name: "Microsoft Planner",
    connected: false,
    statusLabel: "Não conectado — integração futura",
    description: "Indicadores de tarefas e planejamento de times (fase Gestão do Time).",
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    connected: false,
    statusLabel: "Não conectado — integração futura",
    description: "Indicadores de colaboração e reuniões (fase Gestão do Time).",
  },
  {
    id: "outlook",
    name: "Outlook / Microsoft Graph",
    connected: false,
    statusLabel: "Não conectado — integração futura",
    description: "Indicadores de comunicação assíncrona (fase Gestão do Time).",
  },
];
