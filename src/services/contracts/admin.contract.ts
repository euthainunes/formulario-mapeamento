import { AdminUser, AuditLogEntry, IntegrationStatus } from "@/types/admin";

export interface IAdminRepository {
  listUsers(): Promise<AdminUser[]>;
  toggleUserActive(id: string): Promise<AdminUser>;
  listAuditLog(): Promise<AuditLogEntry[]>;
  listIntegrations(): Promise<IntegrationStatus[]>;
}
