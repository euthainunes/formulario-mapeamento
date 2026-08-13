export type PermissionKey =
  | "*"
  | "dashboard.view"
  | "audience.view"
  | "access.view"
  | "content.view"
  | "beezz.view"
  | "engagement.view"
  | "pods.view"
  | "directory.view"
  | "recognition.view"
  | "reports.view"
  | "reports.export"
  | "insights.view"
  | "team-management.view"
  | "admin.view"
  | "admin.users.manage"
  | "admin.permissions.manage"
  | "admin.integrations.manage"
  | "admin.sync.view"
  | "admin.alerts.manage"
  | "admin.audit.view";

export type RoleId = "administradora" | "gestao-comunicacao" | "colaborador";

export interface Role {
  id: RoleId;
  name: string;
  description: string;
  permissions: PermissionKey[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: RoleId;
  department: string;
  jobTitle: string;
  avatarInitials: string;
}
