import { appConfig } from "@/lib/app-config";
import { IAlertsRepository } from "@/services/contracts/alerts.contract";
import { MockAlertsRepository } from "@/services/mock/alerts.mock";
import { Alert, AlertHistoryEntry, AlertRule, AlertStatus } from "@/types/alert";
import { apiFetch } from "@/lib/client/api-fetch";

/** Formatos brutos devolvidos pelo backend (Prisma AlertRule/Alert/AlertHistoryEntry) — thresholds vêm como Decimal (serializado como string em JSON) e o histórico só guarda `changedById` (uuid), sem o nome de exibição do usuário. */
interface RawAlertRule {
  id: string;
  name: string;
  metric: string;
  condition: string;
  threshold: string | number;
  severity: AlertRule["severity"];
  active: boolean;
  createdBy: string | null;
  createdAt: string;
}
interface RawAlertHistoryEntry {
  id: string;
  status: AlertStatus;
  changedById: string | null;
  note: string | null;
  changedAt: string;
}
interface RawAlert {
  id: string;
  ruleId: string;
  rule: { name: string };
  title: string;
  description: string | null;
  severity: Alert["severity"];
  status: AlertStatus;
  createdAt: string;
  metric: string;
  history: RawAlertHistoryEntry[];
}

function adaptRule(raw: RawAlertRule): AlertRule {
  return {
    id: raw.id,
    name: raw.name,
    metric: raw.metric,
    condition: raw.condition,
    threshold: Number(raw.threshold),
    severity: raw.severity,
    active: raw.active,
    createdBy: raw.createdBy ?? "—",
    createdAt: raw.createdAt,
  };
}

function adaptHistory(raw: RawAlertHistoryEntry): AlertHistoryEntry {
  return { id: raw.id, status: raw.status, changedBy: raw.changedById ?? "—", changedAt: raw.changedAt, note: raw.note ?? undefined };
}

function adaptAlert(raw: RawAlert): Alert {
  return {
    id: raw.id,
    ruleId: raw.ruleId,
    ruleName: raw.rule?.name ?? "",
    title: raw.title,
    description: raw.description ?? "",
    severity: raw.severity,
    status: raw.status,
    createdAt: raw.createdAt,
    metric: raw.metric,
    history: raw.history.map(adaptHistory),
  };
}

class ApiAlertsRepository implements IAlertsRepository {
  async listRules(): Promise<AlertRule[]> {
    const raw = await apiFetch<RawAlertRule[]>("/api/alerts/rules");
    return raw.map(adaptRule);
  }
  async createRule(rule: Omit<AlertRule, "id" | "createdAt">): Promise<AlertRule> {
    const raw = await apiFetch<RawAlertRule>("/api/alerts/rules", { method: "POST", body: JSON.stringify(rule) });
    return adaptRule(raw);
  }
  async updateRule(id: string, rule: Partial<AlertRule>): Promise<AlertRule> {
    const raw = await apiFetch<RawAlertRule>(`/api/alerts/rules/${id}`, { method: "PATCH", body: JSON.stringify(rule) });
    return adaptRule(raw);
  }
  async deleteRule(id: string): Promise<void> {
    await apiFetch<{ success: boolean }>(`/api/alerts/rules/${id}`, { method: "DELETE" });
  }
  async listAlerts(): Promise<Alert[]> {
    const raw = await apiFetch<RawAlert[]>("/api/alerts");
    return raw.map(adaptAlert);
  }
  async updateAlertStatus(id: string, status: AlertStatus, _changedBy: string, note?: string): Promise<Alert> {
    // O ator real é derivado no backend a partir do JWT (CurrentUser) — o
    // parâmetro `changedBy` só é usado pelo MockAlertsRepository.
    const raw = await apiFetch<RawAlert>(`/api/alerts/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, note }) });
    return adaptAlert(raw);
  }
}

const mockInstance = new MockAlertsRepository();

export function getAlertsRepository(): IAlertsRepository {
  return appConfig.dataSource === "mock" ? mockInstance : new ApiAlertsRepository();
}
