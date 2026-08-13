export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  active: boolean;
  lastLogin: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  details?: string;
}

export interface IntegrationStatus {
  id: string;
  name: string;
  connected: boolean;
  statusLabel: string;
  description: string;
}
