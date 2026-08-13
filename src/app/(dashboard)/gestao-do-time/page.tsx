import { UsersRound, ListTodo, MessagesSquare, Mail, ShieldAlert } from "lucide-react";
import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Badge } from "@/components/ui/badge";

const FUTURE_INDICATORS = [
  { icon: ListTodo, label: "Tarefas concluídas e em atraso (Microsoft Planner)" },
  { icon: MessagesSquare, label: "Participação em reuniões e canais (Microsoft Teams)" },
  { icon: Mail, label: "Volume de comunicações assíncronas (Outlook / Microsoft Graph)" },
  { icon: UsersRound, label: "Estrutura organizacional e cargos (Entra ID)" },
];

export default function GestaoDoTimePage() {
  return (
    <RouteGuard permission="team-management.view">
      <PageHeader title="Gestão do Time" description="Módulo em construção — integração futura com o ecossistema Microsoft." />

      <SectionCard title="Em breve">
        <div className="flex flex-col items-center text-center py-10 px-4">
          <div className="h-16 w-16 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-4">
            <UsersRound className="h-8 w-8" />
          </div>
          <Badge tone="brand" className="mb-3">
            Em breve
          </Badge>
          <h2 className="text-base font-semibold text-text-primary max-w-md">
            Este módulo vai reunir indicadores de gestão de times a partir da integração com Microsoft Planner,
            Teams, Outlook e Entra ID (Microsoft Graph).
          </h2>
          <p className="text-sm text-text-secondary max-w-lg mt-2">
            Nenhum dado real ou fictício está disponível aqui ainda. Esta tela existe apenas para comunicar o que
            está previsto para as próximas fases do produto.
          </p>
        </div>

        <div className="border-t border-border pt-5 mt-2">
          <p className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wide">
            Indicadores previstos
          </p>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FUTURE_INDICATORS.map((item) => (
              <li key={item.label} className="flex items-start gap-2.5 rounded-lg border border-border p-3">
                <item.icon className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
                <span className="text-sm text-text-primary">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-lg border border-warning/25 bg-warning/5 p-3.5 text-xs text-text-secondary">
          <ShieldAlert className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <p>
            Os indicadores representarão apenas atividades registradas nas ferramentas integradas. Eles não medem
            automaticamente a produtividade real de cada colaborador.
          </p>
        </div>
      </SectionCard>
    </RouteGuard>
  );
}
