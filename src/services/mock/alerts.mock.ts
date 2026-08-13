import { IAlertsRepository } from "@/services/contracts/alerts.contract";
import { Alert, AlertRule, AlertStatus } from "@/types/alert";
import { delay } from "./_shared";
import { MOCK_ALERT_RULES, MOCK_ALERTS } from "@/mocks/alerts.mock";

const rulesStore: AlertRule[] = [...MOCK_ALERT_RULES];
const alertsStore: Alert[] = [...MOCK_ALERTS];

export class MockAlertsRepository implements IAlertsRepository {
  async listRules(): Promise<AlertRule[]> {
    return delay([...rulesStore]);
  }

  async createRule(rule: Omit<AlertRule, "id" | "createdAt">): Promise<AlertRule> {
    const newRule: AlertRule = { ...rule, id: `rule-${Date.now()}`, createdAt: new Date().toISOString() };
    rulesStore.unshift(newRule);
    return delay(newRule, 300, 600);
  }

  async updateRule(id: string, patch: Partial<AlertRule>): Promise<AlertRule> {
    const idx = rulesStore.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Regra de alerta não encontrada.");
    rulesStore[idx] = { ...rulesStore[idx], ...patch };
    return delay(rulesStore[idx], 300, 600);
  }

  async deleteRule(id: string): Promise<void> {
    const idx = rulesStore.findIndex((r) => r.id === id);
    if (idx !== -1) rulesStore.splice(idx, 1);
    return delay(undefined, 200, 400);
  }

  async listAlerts(): Promise<Alert[]> {
    return delay([...alertsStore].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
  }

  async updateAlertStatus(id: string, status: AlertStatus, changedBy: string, note?: string): Promise<Alert> {
    const idx = alertsStore.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Alerta não encontrado.");
    const updated: Alert = {
      ...alertsStore[idx],
      status,
      history: [
        ...alertsStore[idx].history,
        { id: `h-${id}-${Date.now()}`, status, changedBy, changedAt: new Date().toISOString(), note },
      ],
    };
    alertsStore[idx] = updated;
    return delay(updated, 300, 600);
  }
}
