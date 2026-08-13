"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { COMPANIES, DEPARTMENTS, JOB_TITLES, TEAMS } from "@/lib/constants";
import { useGenerateReport } from "@/hooks/use-report-export";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/components/shared/toast";
import { REFERENCE_TODAY, isoDate } from "@/lib/date-range";
import { subDays } from "date-fns";

const schema = z.object({
  type: z.enum(["audiencia", "acessos", "conteudos", "engajamento", "pods", "executivo"]),
  format: z.enum(["pdf", "excel", "csv"]),
  from: z.string().min(1, "Informe a data inicial"),
  to: z.string().min(1, "Informe a data final"),
  company: z.string(),
  department: z.string(),
  jobTitle: z.string(),
  team: z.string(),
});

type FormValues = z.infer<typeof schema>;

const REPORT_TYPES: { value: FormValues["type"]; label: string }[] = [
  { value: "executivo", label: "Executivo" },
  { value: "audiencia", label: "Audiência" },
  { value: "acessos", label: "Acessos" },
  { value: "conteudos", label: "Conteúdos" },
  { value: "engajamento", label: "Engajamento" },
  { value: "pods", label: "Pods" },
];

export function ReportForm() {
  const { user } = useAuth();
  const generateReport = useGenerateReport();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "executivo",
      format: "pdf",
      from: isoDate(subDays(REFERENCE_TODAY, 29)),
      to: isoDate(REFERENCE_TODAY),
      company: "",
      department: "",
      jobTitle: "",
      team: "",
    },
  });

  function onSubmit(values: FormValues) {
    generateReport.mutate(
      {
        createdBy: user?.name ?? "Usuário demonstrativo",
        request: {
          type: values.type,
          format: values.format,
          dateRange: { from: values.from, to: values.to },
          filters: {
            company: values.company || null,
            department: values.department || null,
            jobTitle: values.jobTitle || null,
            team: values.team || null,
          },
        },
      },
      {
        onSuccess: () => toast("Relatório em processamento. Você será atualizado no histórico abaixo.", "info"),
      }
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1">Tipo de relatório</label>
          <Select {...register("type")}>
            {REPORT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1">Formato</label>
          <Select {...register("format")}>
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
            <option value="csv">CSV</option>
          </Select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1">Data inicial</label>
          <Input type="date" {...register("from")} />
          {errors.from && <p className="text-xs text-error mt-1">{errors.from.message}</p>}
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1">Data final</label>
          <Input type="date" {...register("to")} />
          {errors.to && <p className="text-xs text-error mt-1">{errors.to.message}</p>}
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1">Empresa</label>
          <Select {...register("company")}>
            <option value="">Todas</option>
            {COMPANIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1">Departamento</label>
          <Select {...register("department")}>
            <option value="">Todos</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1">Cargo</label>
          <Select {...register("jobTitle")}>
            <option value="">Todos</option>
            {JOB_TITLES.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1">Time</label>
          <Select {...register("team")}>
            <option value="">Todos</option>
            {TEAMS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={generateReport.isPending}>
        {generateReport.isPending ? "Gerando..." : "Gerar relatório"}
      </Button>
    </form>
  );
}
