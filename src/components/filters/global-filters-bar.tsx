"use client";

import { Info } from "lucide-react";
import { useGlobalFilters } from "@/hooks/use-global-filters";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { PeriodPreset } from "@/types/filters";
import { PERIOD_LABELS } from "@/lib/date-range";
import { ORG_FILTER_DISABLED_TOOLTIP, COMPANIES, DEPARTMENTS, JOB_TITLES, TEAMS } from "@/lib/constants";

function OrgSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: string[];
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="min-w-[150px]">
      <div className="flex items-center gap-1 mb-1">
        <label className="text-[11px] font-medium text-text-secondary">{label}</label>
        <Tooltip content={ORG_FILTER_DISABLED_TOOLTIP}>
          <Info className="h-3 w-3 text-text-secondary/70" />
        </Tooltip>
      </div>
      <Select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
      >
        <option value="">Todos</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function GlobalFiltersBar() {
  const filters = useGlobalFilters();

  return (
    <div className="mb-5 flex flex-wrap items-end gap-3 rounded-card border border-border bg-surface p-4">
      <div className="min-w-[150px]">
        <label className="block text-[11px] font-medium text-text-secondary mb-1">Período</label>
        <Select
          value={filters.period}
          onChange={(e) => filters.setPeriod(e.target.value as PeriodPreset)}
        >
          {(Object.keys(PERIOD_LABELS) as PeriodPreset[])
            .filter((p) => p !== "custom")
            .map((p) => (
              <option key={p} value={p}>
                {PERIOD_LABELS[p]}
              </option>
            ))}
        </Select>
      </div>

      <OrgSelect label="Empresa" value={filters.company} options={COMPANIES} onChange={filters.setCompany} />
      <OrgSelect label="Departamento" value={filters.department} options={DEPARTMENTS} onChange={filters.setDepartment} />
      <OrgSelect label="Cargo" value={filters.jobTitle} options={JOB_TITLES} onChange={filters.setJobTitle} />
      <OrgSelect label="Time" value={filters.team} options={TEAMS} onChange={filters.setTeam} />

      <button
        onClick={filters.reset}
        className="text-xs font-medium text-brand-primary hover:underline ml-auto"
      >
        Limpar filtros
      </button>
    </div>
  );
}
