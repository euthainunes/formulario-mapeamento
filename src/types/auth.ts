// Estas strings foram alinhadas com o catálogo de permissões do backend
// (backend/src/auth/permissions.constants.ts). "*" é uma convenção só do
// mock do front-end para representar acesso total (o backend representa a
// Administradora atribuindo a lista completa de permissões, sem coringa).
// "team-management.view" e "admin.view" são exclusivas do front-end: gates
// de agrupamento de UI (placeholder "Em breve" e visão geral de Admin) sem
// dado real por trás ainda, então não existem no catálogo do backend.
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
  | "awards.view"
  | "report.view"
  | "report.export"
  | "insights.view"
  | "insights.ask"
  | "alert.view"
  | "team-management.view"
  | "admin.view"
  | "user.manage"
  | "role.manage"
  | "integration.manage"
  | "sync.view"
  | "alert.manage"
  | "audit.view";

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
