import { IAdminRepository } from "@/services/contracts/admin.contract";
import { AdminUser, AuditLogEntry, IntegrationStatus } from "@/types/admin";
import { delay } from "./_shared";
import { MOCK_ADMIN_USERS, MOCK_AUDIT_LOG, MOCK_INTEGRATIONS } from "@/mocks/admin.mock";

const usersStore: AdminUser[] = [...MOCK_ADMIN_USERS];

export class MockAdminRepository implements IAdminRepository {
  async listUsers(): Promise<AdminUser[]> {
    return delay([...usersStore]);
  }

  async toggleUserActive(id: string): Promise<AdminUser> {
    const idx = usersStore.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error("Usuário não encontrado.");
    usersStore[idx] = { ...usersStore[idx], active: !usersStore[idx].active };
    return delay(usersStore[idx], 300, 500);
  }

  async listAuditLog(): Promise<AuditLogEntry[]> {
    return delay(MOCK_AUDIT_LOG);
  }

  async listIntegrations(): Promise<IntegrationStatus[]> {
    return delay(MOCK_INTEGRATIONS);
  }
}
