import { appConfig } from "@/lib/app-config";
import { IAlertsRepository } from "@/services/contracts/alerts.contract";
import { MockAlertsRepository } from "@/services/mock/alerts.mock";
import { Alert, AlertRule, AlertStatus } from "@/types/alert";

class ApiAlertsRepository implements IAlertsRepository {
  async listRules(): Promise<AlertRule[]> {
    throw new Error("ApiAlertsRepository não implementado — integração real ainda não disponível.");
  }
  async createRule(_rule: Omit<AlertRule, "id" | "createdAt">): Promise<AlertRule> {
    throw new Error("ApiAlertsRepository não implementado — integração real ainda não disponível.");
  }
  async updateRule(_id: string, _rule: Partial<AlertRule>): Promise<AlertRule> {
    throw new Error("ApiAlertsRepository não implementado — integração real ainda não disponível.");
  }
  async deleteRule(_id: string): Promise<void> {
    throw new Error("ApiAlertsRepository não implementado — integração real ainda não disponível.");
  }
  async listAlerts(): Promise<Alert[]> {
    throw new Error("ApiAlertsRepository não implementado — integração real ainda não disponível.");
  }
  async updateAlertStatus(_id: string, _status: AlertStatus, _changedBy: string, _note?: string): Promise<Alert> {
    throw new Error("ApiAlertsRepository não implementado — integração real ainda não disponível.");
  }
}

const mockInstance = new MockAlertsRepository();

export function getAlertsRepository(): IAlertsRepository {
  return appConfig.dataSource === "mock" ? mockInstance : new ApiAlertsRepository();
}
