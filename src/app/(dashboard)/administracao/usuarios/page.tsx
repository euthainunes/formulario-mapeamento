"use client";

import { ColumnDef } from "@tanstack/react-table";
import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { SectionCard } from "@/components/shared/section-card";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminUsers, useToggleAdminUser } from "@/hooks/use-admin";
import { AdminUser } from "@/types/admin";
import { formatDateTime } from "@/lib/formatters";
import { toast } from "@/components/shared/toast";

export default function AdminUsuariosPage() {
  const { data, isLoading, isError } = useAdminUsers();
  const toggleUser = useToggleAdminUser();

  const columns: ColumnDef<AdminUser, unknown>[] = [
    { accessorKey: "name", header: "Nome" },
    { accessorKey: "email", header: "E-mail" },
    { accessorKey: "role", header: "Perfil" },
    { accessorKey: "department", header: "Departamento" },
    { accessorKey: "lastLogin", header: "Último acesso", cell: ({ row }) => formatDateTime(row.original.lastLogin) },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => <Badge tone={row.original.active ? "success" : "neutral"}>{row.original.active ? "Ativo" : "Inativo"}</Badge>,
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toggleUser.mutate(row.original.id, {
              onSuccess: (updated) =>
                toast(`${updated.name} agora está ${updated.active ? "ativo" : "inativo"}.`, "success"),
            })
          }
        >
          {row.original.active ? "Desativar" : "Ativar"}
        </Button>
      ),
    },
  ];

  return (
    <RouteGuard permission="user.manage">
      <PageHeader title="Administração — Usuários" description="Gerencie os usuários com acesso à plataforma." />
      <AdminNav />
      <SectionCard title="Usuários cadastrados">
        <StateWrapper isLoading={isLoading} isError={isError} isEmpty={!data || data.length === 0}>
          {data && <DataTable columns={columns} data={data} searchPlaceholder="Buscar usuário..." />}
        </StateWrapper>
      </SectionCard>
    </RouteGuard>
  );
}
