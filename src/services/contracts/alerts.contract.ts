import { Alert, AlertRule, AlertStatus } from "@/types/alert";

export interface IAlertsRepository {
  listRules(): Promise<AlertRule[]>;
  createRule(rule: Omit<AlertRule, "id" | "createdAt">): Promise<AlertRule>;
  updateRule(id: string, rule: Partial<AlertRule>): Promise<AlertRule>;
  deleteRule(id: string): Promise<void>;
  listAlerts(): Promise<Alert[]>;
  updateAlertStatus(id: string, status: AlertStatus, changedBy: string, note?: string): Promise<Alert>;
}
