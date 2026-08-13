export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "novo" | "em_analise" | "resolvido" | "ignorado";

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: string; // e.g. "queda > 15% em 7 dias"
  threshold: number;
  severity: AlertSeverity;
  active: boolean;
  createdBy: string;
  createdAt: string;
}

export interface AlertHistoryEntry {
  id: string;
  status: AlertStatus;
  changedBy: string;
  changedAt: string;
  note?: string;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  createdAt: string;
  metric: string;
  history: AlertHistoryEntry[];
}

export interface AlertSummary {
  id: string;
  title: string;
  severity: AlertSeverity;
  createdAt: string;
}
