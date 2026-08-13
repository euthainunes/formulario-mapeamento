"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { GlobalFiltersBar } from "@/components/filters/global-filters-bar";
import { useGlobalFilters } from "@/hooks/use-global-filters";
import { useDirectoryData } from "@/hooks/use-directory-data";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { CollaboratorCard } from "@/components/shared/collaborator-card";
import { ExportButtons } from "@/components/shared/export-buttons";
import { Input } from "@/components/ui/input";

export default function DiretorioPage() {
  const filters = useGlobalFilters();
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useDirectoryData(filters, search);

  return (
    <RouteGuard permission="directory.view">
      <PageHeader
        title="Diretório e Perfis"
        description="Encontre colaboradores por nome, área, cargo, time ou competências."
        actions={<ExportButtons label="diretório" />}
      />
      <GlobalFiltersBar />

      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, cargo, time ou competência..."
          className="pl-8"
        />
      </div>

      <StateWrapper
        isLoading={isLoading}
        isError={isError}
        isEmpty={!data || data.people.length === 0}
        partialCoverage={data?.partialCoverage}
        emptyMessage="Nenhum colaborador encontrado para a busca/filtros aplicados."
      >
        {data && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.people.slice(0, 60).map((person) => (
              <CollaboratorCard key={person.id} person={person} />
            ))}
          </div>
        )}
      </StateWrapper>
    </RouteGuard>
  );
}
