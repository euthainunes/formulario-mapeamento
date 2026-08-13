import { PermissionKey, Role, RoleId } from "@/types/auth";

export const ROLES: Record<RoleId, Role> = {
  administradora: {
    id: "administradora",
    name: "Administradora",
    description: "Acesso total à plataforma, incluindo administração e integrações.",
    permissions: ["*"],
  },
  "gestao-comunicacao": {
    id: "gestao-comunicacao",
    name: "Gestão de Comunicação",
    description:
      "Acesso a dashboards, relatórios, conteúdos, audiência, insights e alertas. Sem gestão de usuários, integrações ou auditoria.",
    permissions: [
      "dashboard.view",
      "audience.view",
      "access.view",
      "content.view",
      "beezz.view",
      "engagement.view",
      "pods.view",
      "directory.view",
      "recognition.view",
      "reports.view",
      "reports.export",
      "insights.view",
      "team-management.view",
    ],
  },
  colaborador: {
    id: "colaborador",
    name: "Colaborador",
    description: "Acesso limitado: dashboard, conteúdos, Beezz e pods, sem exportação ou administração.",
    permissions: ["dashboard.view", "content.view", "beezz.view", "pods.view"],
  },
};

export function hasPermission(userPermissions: PermissionKey[], required: PermissionKey): boolean {
  if (userPermissions.includes("*")) return true;
  return userPermissions.includes(required);
}
