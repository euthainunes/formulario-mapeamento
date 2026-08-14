import { TeamMeeting, MeetingShowAs, MeetingType } from "@/types/team-management";
import { relativeIso } from "./_helpers";

/**
 * Agenda institucional (calendário compartilhado) do time de Comunicação —
 * metadados de reunião apenas, sem lista de participantes individuais (ver
 * nota de privacidade em src/types/team-management.ts). Cobre as últimas
 * semanas e as próximas duas semanas, para permitir cálculo de horas de
 * reunião / densidade de agenda tanto em janelas passadas quanto futuras.
 */
interface MeetingSpec {
  id: string;
  subject: string;
  campaignId?: string;
  dayOffset: number;
  startHour: number;
  durationMinutes: number;
  meetingType: MeetingType;
  showAs?: MeetingShowAs;
  isCancelled?: boolean;
  location: string;
  modifiedOffset?: number;
}

function makeMeeting(spec: MeetingSpec): TeamMeeting {
  const startIso = relativeIso(spec.dayOffset, spec.startHour, 0);
  const startDate = new Date(startIso);
  const endDate = new Date(startDate.getTime() + spec.durationMinutes * 60_000);
  return {
    id: spec.id,
    subject: spec.subject,
    campaignId: spec.campaignId,
    start: startIso,
    end: endDate.toISOString(),
    isAllDay: false,
    showAs: spec.isCancelled ? "free" : spec.showAs ?? "busy",
    isCancelled: spec.isCancelled ?? false,
    location: spec.location,
    meetingType: spec.meetingType,
    lastModifiedDateTime: relativeIso(spec.modifiedOffset ?? spec.dayOffset - 1, 17, 0),
  };
}

const SPECS: MeetingSpec[] = [
  { id: "m-1", subject: "Comitê de Comunicação Interna", dayOffset: -21, startHour: 9, durationMinutes: 60, meetingType: "alinhamento", location: "Sala Colmeia 1" },
  { id: "m-2", subject: "Kickoff Campanha de segurança", campaignId: "camp-seguranca", dayOffset: -20, startHour: 10, durationMinutes: 60, meetingType: "planejamento", location: "Sala Colmeia 1" },
  { id: "m-3", subject: "Aprovação de peças — Dia dos Pais", campaignId: "camp-dia-dos-pais", dayOffset: -19, startHour: 14, durationMinutes: 60, meetingType: "aprovacao", location: "Sala Colmeia 2" },
  { id: "m-4", subject: "Briefing Evento corporativo", campaignId: "camp-evento-corporativo", dayOffset: -18, startHour: 11, durationMinutes: 60, meetingType: "planejamento", location: "Auditório — Matriz" },
  { id: "m-5", subject: "Alinhamento semanal de Comunicação", dayOffset: -17, startHour: 9, durationMinutes: 30, meetingType: "alinhamento", location: "Microsoft Teams" },
  { id: "m-6", subject: "Reunião com fornecedor de brindes", campaignId: "camp-evento-corporativo", dayOffset: -16, startHour: 15, durationMinutes: 45, meetingType: "alinhamento", showAs: "tentative", location: "Microsoft Teams" },
  { id: "m-7", subject: "Planejamento Pesquisa de clima", campaignId: "camp-pesquisa-clima", dayOffset: -15, startHour: 10, durationMinutes: 60, meetingType: "planejamento", location: "Sala Colmeia 2" },
  { id: "m-8", subject: "Reunião de pauta — Newsletter interna", campaignId: "camp-newsletter-interna", dayOffset: -14, startHour: 9, durationMinutes: 45, meetingType: "planejamento", location: "Microsoft Teams" },
  { id: "m-9", subject: "Aprovação jurídica — Campanha de segurança", campaignId: "camp-seguranca", dayOffset: -13, startHour: 16, durationMinutes: 60, meetingType: "aprovacao", location: "Sala Colmeia 1" },
  { id: "m-10", subject: "Alinhamento semanal de Comunicação", dayOffset: -10, startHour: 9, durationMinutes: 30, meetingType: "alinhamento", location: "Microsoft Teams" },
  { id: "m-11", subject: "Follow-up orçamento Evento corporativo", campaignId: "camp-evento-corporativo", dayOffset: -9, startHour: 14, durationMinutes: 60, meetingType: "alinhamento", isCancelled: true, location: "Microsoft Teams" },
  { id: "m-12", subject: "Briefing fornecedor de brindes — Campanha de segurança", campaignId: "camp-seguranca", dayOffset: -8, startHour: 11, durationMinutes: 45, meetingType: "planejamento", location: "Microsoft Teams" },
  { id: "m-13", subject: "Retrospectiva do mês — Comunicação Interna", dayOffset: -7, startHour: 15, durationMinutes: 60, meetingType: "alinhamento", location: "Sala Colmeia 1" },
  { id: "m-14", subject: "Comitê de reconhecimento — validação de indicados", campaignId: "camp-reconhecimento", dayOffset: -6, startHour: 10, durationMinutes: 45, meetingType: "aprovacao", location: "Sala Colmeia 2" },
  { id: "m-15", subject: "Alinhamento semanal de Comunicação", dayOffset: -3, startHour: 9, durationMinutes: 30, meetingType: "alinhamento", location: "Microsoft Teams" },
  { id: "m-16", subject: "Revisão de cronograma — Comunicação de benefícios", campaignId: "camp-beneficios", dayOffset: -3, startHour: 13, durationMinutes: 45, meetingType: "planejamento", location: "Microsoft Teams" },
  { id: "m-17", subject: "Validação de dados com RH — Comunicação de resultados", campaignId: "camp-comunicacao-resultados", dayOffset: -2, startHour: 11, durationMinutes: 60, meetingType: "alinhamento", location: "Sala Colmeia 2" },
  { id: "m-18", subject: "Comitê editorial do portal", campaignId: "camp-atualizacao-portal", dayOffset: -2, startHour: 15, durationMinutes: 45, meetingType: "alinhamento", location: "Microsoft Teams" },
  { id: "m-19", subject: "Alinhamento produção de peças", campaignId: "camp-pecas-comunicacao", dayOffset: -1, startHour: 10, durationMinutes: 45, meetingType: "alinhamento", location: "Sala Colmeia 1" },
  { id: "m-20", subject: "Aprovação jurídica — banner de segurança", campaignId: "camp-seguranca", dayOffset: 0, startHour: 16, durationMinutes: 30, meetingType: "aprovacao", showAs: "tentative", location: "Microsoft Teams" },
  { id: "m-21", subject: "Alinhamento semanal de Comunicação", dayOffset: 1, startHour: 9, durationMinutes: 30, meetingType: "alinhamento", location: "Microsoft Teams" },
  { id: "m-22", subject: "Validação final — apresentação de resultados", campaignId: "camp-comunicacao-resultados", dayOffset: 2, startHour: 14, durationMinutes: 60, meetingType: "aprovacao", location: "Auditório — Matriz" },
  { id: "m-23", subject: "Comitê de Comunicação Interna", dayOffset: 3, startHour: 9, durationMinutes: 60, meetingType: "alinhamento", location: "Sala Colmeia 1" },
  { id: "m-24", subject: "Reunião com fornecedor de estrutura — Evento corporativo", campaignId: "camp-evento-corporativo", dayOffset: 4, startHour: 11, durationMinutes: 45, meetingType: "alinhamento", showAs: "tentative", location: "Microsoft Teams" },
  { id: "m-25", subject: "Revisão de indicadores da Pesquisa de clima", campaignId: "camp-pesquisa-clima", dayOffset: 5, startHour: 10, durationMinutes: 45, meetingType: "alinhamento", location: "Sala Colmeia 2" },
  { id: "m-26", subject: "Alinhamento semanal de Comunicação", dayOffset: 8, startHour: 9, durationMinutes: 30, meetingType: "alinhamento", location: "Microsoft Teams" },
  { id: "m-27", subject: "Planejamento cronograma do Evento corporativo", campaignId: "camp-evento-corporativo", dayOffset: 9, startHour: 14, durationMinutes: 60, meetingType: "planejamento", location: "Auditório — Matriz" },
  { id: "m-28", subject: "Aprovação de peças — Produção de comunicação", campaignId: "camp-pecas-comunicacao", dayOffset: 10, startHour: 11, durationMinutes: 45, meetingType: "aprovacao", location: "Sala Colmeia 1" },
  { id: "m-29", subject: "Comitê de Comunicação Interna", dayOffset: 15, startHour: 9, durationMinutes: 60, meetingType: "alinhamento", location: "Sala Colmeia 1" },
  { id: "m-30", subject: "Evento corporativo — reunião de produção geral", campaignId: "camp-evento-corporativo", dayOffset: 16, startHour: 13, durationMinutes: 90, meetingType: "evento", location: "Auditório — Matriz" },
];

export const TEAM_MEETINGS: TeamMeeting[] = SPECS.map(makeMeeting);
