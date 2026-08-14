import { appConfig } from "@/lib/app-config";
import { IAdminRepository } from "@/services/contracts/admin.contract";
import { MockAdminRepository } from "@/services/mock/admin.mock";
import { AdminUser, AuditLogEntry, IntegrationStatus } from "@/types/admin";
import { apiFetch } from "@/lib/client/api-fetch";

/** Formato bruto devolvido por GET /users (Prisma User sanitizado, com userRoles/role/department incluídos). */
interface RawAdminUser {
  id: string;
  name: string;
  email: string;
  active: boolean;
  lastLoginAt: string | null;
  department: { name: string } | null;
  userRoles: { role: { name: string } }[];
}
interface RawAuditLogEntry {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  afterJson: unknown;
  createdAt: string;
}

function adaptUser(raw: RawAdminUser): AdminUser {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    role: raw.userRoles.map((ur) => ur.role.name).join(", ") || "—",
    department: raw.department?.name ?? "—",
    active: raw.active,
    lastLogin: raw.lastLoginAt ?? "",
  };
}

function adaptAuditLog(raw: RawAuditLogEntry): AuditLogEntry {
  return {
    id: raw.id,
    actor: raw.actorName ?? raw.actorId ?? "sistema",
    action: raw.action,
    target: raw.targetId ? `${raw.targetType} #${raw.targetId}` : raw.targetType,
    timestamp: raw.createdAt,
    details: raw.afterJson ? JSON.stringify(raw.afterJson) : undefined,
  };
}

class ApiAdminRepository implements IAdminRepository {
  async listUsers(): Promise<AdminUser[]> {
    const raw = await apiFetch<RawAdminUser[]>("/api/admin/users");
    return raw.map(adaptUser);
  }
  async toggleUserActive(id: string): Promise<AdminUser> {
    const raw = await apiFetch<RawAdminUser>(`/api/admin/users/${id}/toggle-active`, { method: "PATCH" });
    return adaptUser(raw);
  }
  async listAuditLog(): Promise<AuditLogEntry[]> {
    const raw = await apiFetch<RawAuditLogEntry[]>("/api/admin/audit-log");
    return raw.map(adaptAuditLog);
  }
  async listIntegrations(): Promise<IntegrationStatus[]> {
    return apiFetch<IntegrationStatus[]>("/api/admin/integrations");
  }
}

const mockInstance = new MockAdminRepository();

export function getAdminRepository(): IAdminRepository {
  return appConfig.dataSource === "mock" ? mockInstance : new ApiAdminRepository();
}
