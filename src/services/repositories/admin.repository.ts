import { appConfig } from "@/lib/app-config";
import { IAdminRepository } from "@/services/contracts/admin.contract";
import { MockAdminRepository } from "@/services/mock/admin.mock";
import { AdminUser, AuditLogEntry, IntegrationStatus } from "@/types/admin";

class ApiAdminRepository implements IAdminRepository {
  async listUsers(): Promise<AdminUser[]> {
    throw new Error("ApiAdminRepository não implementado — integração real ainda não disponível.");
  }
  async toggleUserActive(_id: string): Promise<AdminUser> {
    throw new Error("ApiAdminRepository não implementado — integração real ainda não disponível.");
  }
  async listAuditLog(): Promise<AuditLogEntry[]> {
    throw new Error("ApiAdminRepository não implementado — integração real ainda não disponível.");
  }
  async listIntegrations(): Promise<IntegrationStatus[]> {
    throw new Error("ApiAdminRepository não implementado — integração real ainda não disponível.");
  }
}

const mockInstance = new MockAdminRepository();

export function getAdminRepository(): IAdminRepository {
  return appConfig.dataSource === "mock" ? mockInstance : new ApiAdminRepository();
}
