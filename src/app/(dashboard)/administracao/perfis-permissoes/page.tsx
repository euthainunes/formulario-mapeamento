import { Check, Minus } from "lucide-react";
import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { SectionCard } from "@/components/shared/section-card";
import { ROLES } from "@/lib/permissions";
import { hasPermission } from "@/lib/permissions";
import { PermissionKey, RoleId } from "@/types/auth";

const PERMISSION_LABELS: Record<Exclude<PermissionKey, "*">, string> = {
  "dashboard.view": "Ver Dashboard Executivo",
  "audience.view": "Ver Pessoas e Audiência",
  "access.view": "Ver Acessos",
  "content.view": "Ver Conteúdos e Notícias",
  "beezz.view": "Ver Beezz",
  "engagement.view": "Ver Engajamento e Reações",
  "pods.view": "Ver Pods",
  "directory.view": "Ver Diretório e Perfis",
  "recognition.view": "Ver Reconhecimento",
  "reports.view": "Ver Relatórios",
  "reports.export": "Exportar relatórios/dados",
  "insights.view": "Ver Insights com IA",
  "team-management.view": "Ver Gestão do Time",
  "admin.view": "Acessar Administração",
  "admin.users.manage": "Gerenciar usuários",
  "admin.permissions.manage": "Gerenciar perfis e permissões",
  "admin.integrations.manage": "Gerenciar integrações",
  "admin.sync.view": "Ver sincronizações",
  "admin.alerts.manage": "Gerenciar alertas",
  "admin.audit.view": "Ver auditoria",
};

const ROLE_ORDER: RoleId[] = ["administradora", "gestao-comunicacao", "colaborador"];

export default function PerfisPermissoesPage() {
  const permissionKeys = Object.keys(PERMISSION_LABELS) as Exclude<PermissionKey, "*">[];

  return (
    <RouteGuard permission="admin.permissions.manage">
      <PageHeader title="Administração — Perfis e Permissões" description="Matriz visual de permissões por perfil de acesso." />
      <AdminNav />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-5">
        {ROLE_ORDER.map((roleId) => (
          <div key={roleId} className="rounded-card border border-border bg-surface p-4">
            <p className="text-sm font-semibold text-text-primary">{ROLES[roleId].name}</p>
            <p className="text-xs text-text-secondary mt-1">{ROLES[roleId].description}</p>
          </div>
        ))}
      </div>

      <SectionCard title="Matriz de permissões">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-3 py-2 text-xs font-semibold text-text-secondary">Permissão</th>
                {ROLE_ORDER.map((roleId) => (
                  <th key={roleId} className="text-center px-3 py-2 text-xs font-semibold text-text-secondary">
                    {ROLES[roleId].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissionKeys.map((key) => (
                <tr key={key} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-text-primary">{PERMISSION_LABELS[key]}</td>
                  {ROLE_ORDER.map((roleId) => (
                    <td key={roleId} className="text-center px-3 py-2">
                      {hasPermission(ROLES[roleId].permissions, key) ? (
                        <Check className="h-4 w-4 text-success inline" />
                      ) : (
                        <Minus className="h-4 w-4 text-text-secondary/40 inline" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </RouteGuard>
  );
}
