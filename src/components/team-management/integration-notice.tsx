import { PlugZap } from "lucide-react";

export function IntegrationNotice() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-info/25 bg-info/5 p-3.5 text-xs text-text-secondary mb-5">
      <PlugZap className="h-4 w-4 text-info shrink-0 mt-0.5" />
      <p>
        Dados simulados, estruturados no formato esperado do Microsoft Planner/Outlook/SharePoint. Integração real
        pendente de credenciais e aprovação técnica.
      </p>
    </div>
  );
}
