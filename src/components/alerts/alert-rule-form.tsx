"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertRule } from "@/types/alert";
import { useCreateAlertRule, useUpdateAlertRule } from "@/hooks/use-alerts";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/components/shared/toast";

const schema = z.object({
  name: z.string().min(3, "Informe um nome com pelo menos 3 caracteres"),
  metric: z.string().min(2, "Informe a métrica monitorada"),
  condition: z.string().min(3, "Descreva a condição do alerta"),
  threshold: z.number().min(0, "O limite deve ser maior ou igual a 0"),
  severity: z.enum(["info", "warning", "critical"]),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface AlertRuleFormProps {
  open: boolean;
  onClose: () => void;
  rule?: AlertRule | null;
}

export function AlertRuleForm({ open, onClose, rule }: AlertRuleFormProps) {
  const { user } = useAuth();
  const createRule = useCreateAlertRule();
  const updateRule = useUpdateAlertRule();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: rule
      ? {
          name: rule.name,
          metric: rule.metric,
          condition: rule.condition,
          threshold: rule.threshold,
          severity: rule.severity,
          active: rule.active,
        }
      : { name: "", metric: "", condition: "", threshold: 10, severity: "warning", active: true },
  });

  function onSubmit(values: FormValues) {
    if (rule) {
      updateRule.mutate(
        { id: rule.id, patch: values },
        {
          onSuccess: () => {
            toast("Regra de alerta atualizada.", "success");
            reset();
            onClose();
          },
        }
      );
    } else {
      createRule.mutate(
        { ...values, createdBy: user?.name ?? "Usuário demonstrativo" },
        {
          onSuccess: () => {
            toast("Regra de alerta criada.", "success");
            reset();
            onClose();
          },
        }
      );
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={rule ? "Editar regra de alerta" : "Nova regra de alerta"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1">Nome</label>
          <Input {...register("name")} />
          {errors.name && <p className="text-xs text-error mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1">Métrica monitorada</label>
          <Input {...register("metric")} />
          {errors.metric && <p className="text-xs text-error mt-1">{errors.metric.message}</p>}
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1">Condição</label>
          <Input {...register("condition")} />
          {errors.condition && <p className="text-xs text-error mt-1">{errors.condition.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-text-secondary mb-1">Limite (%)</label>
            <Input type="number" {...register("threshold", { valueAsNumber: true })} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-text-secondary mb-1">Severidade</label>
            <Select {...register("severity")}>
              <option value="info">Informativa</option>
              <option value="warning">Atenção</option>
              <option value="critical">Crítica</option>
            </Select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input type="checkbox" {...register("active")} className="h-4 w-4" />
          Regra ativa
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createRule.isPending || updateRule.isPending}>
            {rule ? "Salvar alterações" : "Criar regra"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
