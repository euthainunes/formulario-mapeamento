"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { AlertRule } from "@/types/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertRuleForm } from "@/components/alerts/alert-rule-form";
import { useDeleteAlertRule } from "@/hooks/use-alerts";
import { toast } from "@/components/shared/toast";

const SEVERITY_TONE = { info: "info", warning: "warning", critical: "critical" } as const;

export function AlertRuleList({ rules }: { rules: AlertRule[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AlertRule | null>(null);
  const deleteRule = useDeleteAlertRule();

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nova regra
        </Button>
      </div>

      <div className="space-y-2">
        {rules.map((rule) => (
          <div key={rule.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-text-primary">{rule.name}</p>
                <Badge tone={SEVERITY_TONE[rule.severity]}>{rule.severity}</Badge>
                <Badge tone={rule.active ? "success" : "neutral"}>{rule.active ? "ativa" : "inativa"}</Badge>
              </div>
              <p className="text-xs text-text-secondary mt-1">{rule.condition}</p>
              <p className="text-xs text-text-secondary/70 mt-0.5">Métrica: {rule.metric} · Criada por {rule.createdBy}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(rule);
                  setFormOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  deleteRule.mutate(rule.id, { onSuccess: () => toast("Regra de alerta removida.", "info") })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AlertRuleForm open={formOpen} onClose={() => setFormOpen(false)} rule={editing} />
    </div>
  );
}
