import { TeamTask, TeamTaskPriority } from "@/types/team-management";
import { relativeIso } from "./_helpers";
import { TEAM_PLAN, BUCKET_ID } from "./plan.mock";

/**
 * ~64 tarefas do Planner distribuídas entre as 10 campanhas/projetos e os 7
 * buckets do fluxo. Os dados são literais (não geração aleatória) — já
 * 100% determinísticos por construção — mas propositalmente incluem os
 * cenários pedidos pela Bruna para alimentar KPIs/alertas: tarefas
 * atrasadas, sem responsável, paradas (sem alteração há mais de 7 dias),
 * críticas vencendo em até 48h, tarefas bloqueadas e uma concentração de
 * carga real em Mariana da Silva (coordenadora, que acumula aprovações em
 * várias campanhas — não é avaliação de desempenho, é reflexo do papel dela
 * no fluxo, ver aviso de política em src/lib/team-metrics.ts).
 */
interface TaskSpec {
  id: string;
  bucketId: string;
  campaignId: string;
  title: string;
  percentComplete: number;
  priority: TeamTaskPriority;
  startOffset?: number | null;
  dueOffset?: number | null;
  completedOffset?: number | null;
  createdOffset: number;
  modifiedOffset: number;
  assignees?: string[];
  labels?: string[];
  isBlocked?: boolean;
  blockerType?: string;
  blockedSinceOffset?: number;
  dependencyOwner?: string;
  nextAction?: string;
}

function makeTask(spec: TaskSpec): TeamTask {
  const assigneeNames = spec.assignees ?? [];
  return {
    id: spec.id,
    planId: TEAM_PLAN.id,
    bucketId: spec.bucketId,
    campaignId: spec.campaignId,
    title: spec.title,
    percentComplete: spec.percentComplete,
    priority: spec.priority,
    startDateTime: spec.startOffset != null ? relativeIso(spec.startOffset, 9) : null,
    dueDateTime: spec.dueOffset != null ? relativeIso(spec.dueOffset, 18) : null,
    completedDateTime: spec.completedOffset != null ? relativeIso(spec.completedOffset, 17) : null,
    createdDateTime: relativeIso(spec.createdOffset, 9, 15),
    lastModifiedDateTime: relativeIso(spec.modifiedOffset, 16, 30),
    assigneeNames,
    primaryAssigneeName: assigneeNames[0] ?? null,
    labels: spec.labels ?? [],
    isBlocked: spec.isBlocked ?? false,
    blockerType: spec.blockerType,
    blockedSince: spec.blockedSinceOffset != null ? relativeIso(spec.blockedSinceOffset) : undefined,
    dependencyOwner: spec.dependencyOwner,
    nextAction: spec.nextAction,
    sourceUrl: `https://tasks.office.com/beehome365.onmicrosoft.com/Home/Task/${spec.id}`,
  };
}

const SPECS: TaskSpec[] = [
  // --- Campanha de Dia dos Pais (concluída) ---------------------------------
  { id: "t-dia-dos-pais-1", bucketId: BUCKET_ID.concluido, campaignId: "camp-dia-dos-pais", title: "Definir conceito criativo da campanha", percentComplete: 100, priority: 5, createdOffset: -42, modifiedOffset: -40, completedOffset: -38, dueOffset: -38, assignees: ["Mariana da Silva"] },
  { id: "t-dia-dos-pais-2", bucketId: BUCKET_ID.concluido, campaignId: "camp-dia-dos-pais", title: "Criar peças de e-mail e banner", percentComplete: 100, priority: 5, createdOffset: -38, modifiedOffset: -30, completedOffset: -28, dueOffset: -28, assignees: ["Camila Pessoa"] },
  { id: "t-dia-dos-pais-3", bucketId: BUCKET_ID.concluido, campaignId: "camp-dia-dos-pais", title: "Aprovar peças com jurídico", percentComplete: 100, priority: 3, createdOffset: -30, modifiedOffset: -25, completedOffset: -24, dueOffset: -24, assignees: ["Mariana da Silva"] },
  { id: "t-dia-dos-pais-4", bucketId: BUCKET_ID.concluido, campaignId: "camp-dia-dos-pais", title: "Agendar disparo de e-mail", percentComplete: 100, priority: 5, createdOffset: -20, modifiedOffset: -10, completedOffset: -9, dueOffset: -9, assignees: ["Thaina Nunes"] },
  { id: "t-dia-dos-pais-5", bucketId: BUCKET_ID.concluido, campaignId: "camp-dia-dos-pais", title: "Publicar banner na home da intranet", percentComplete: 100, priority: 5, createdOffset: -15, modifiedOffset: -8, completedOffset: -8, dueOffset: -8, assignees: ["Thaina Nunes"] },
  { id: "t-dia-dos-pais-6", bucketId: BUCKET_ID.aprovacao, campaignId: "camp-dia-dos-pais", title: "Registrar aprendizados da campanha", percentComplete: 40, priority: 1, createdOffset: -25, modifiedOffset: -20, assignees: [] },

  // --- Newsletter interna (recorrente) --------------------------------------
  { id: "t-newsletter-1", bucketId: BUCKET_ID.planejamento, campaignId: "camp-newsletter-interna", title: "Definir pauta da edição do mês", percentComplete: 30, priority: 3, createdOffset: -6, modifiedOffset: -1, dueOffset: 5, assignees: ["Thaina Nunes"] },
  { id: "t-newsletter-2", bucketId: BUCKET_ID.producao, campaignId: "camp-newsletter-interna", title: "Redigir copy do e-mail", percentComplete: 60, priority: 5, createdOffset: -5, modifiedOffset: -1, dueOffset: 4, assignees: ["Thaina Nunes", "Sarah dos Santos"] },
  { id: "t-newsletter-3", bucketId: BUCKET_ID.backlog, campaignId: "camp-newsletter-interna", title: "Revisar segmentação de público", percentComplete: 0, priority: 3, createdOffset: -12, modifiedOffset: -12, dueOffset: 6, assignees: [] },
  { id: "t-newsletter-4", bucketId: BUCKET_ID.aprovacao, campaignId: "camp-newsletter-interna", title: "Consolidar métricas de abertura do mês passado", percentComplete: 70, priority: 1, createdOffset: -20, modifiedOffset: -14, dueOffset: -13, assignees: ["Hector Kodi"] },
  { id: "t-newsletter-5", bucketId: BUCKET_ID.agendamento, campaignId: "camp-newsletter-interna", title: "Agendar disparo na intranet", percentComplete: 90, priority: 5, createdOffset: -3, modifiedOffset: -1, dueOffset: 2, assignees: ["Thaina Nunes"] },
  { id: "t-newsletter-6", bucketId: BUCKET_ID.concluido, campaignId: "camp-newsletter-interna", title: "Publicar edição anterior", percentComplete: 100, priority: 5, createdOffset: -35, modifiedOffset: -33, completedOffset: -33, dueOffset: -33, assignees: ["Thaina Nunes"] },
  { id: "t-newsletter-7", bucketId: BUCKET_ID.backlog, campaignId: "camp-newsletter-interna", title: "Revisar identidade visual do template", percentComplete: 0, priority: 1, createdOffset: -2, modifiedOffset: -2, dueOffset: 20, assignees: ["Sarah dos Santos"] },

  // --- Comunicação de benefícios ---------------------------------------------
  { id: "t-beneficios-1", bucketId: BUCKET_ID.concluido, campaignId: "camp-beneficios", title: "Briefing com RH sobre novos benefícios", percentComplete: 100, priority: 5, createdOffset: -24, modifiedOffset: -22, completedOffset: -22, dueOffset: -22, assignees: ["Camila Pessoa"] },
  { id: "t-beneficios-2", bucketId: BUCKET_ID.producao, campaignId: "camp-beneficios", title: "Redigir copy do e-mail", percentComplete: 55, priority: 5, createdOffset: -10, modifiedOffset: -2, dueOffset: 3, assignees: ["Camila Pessoa"] },
  { id: "t-beneficios-3", bucketId: BUCKET_ID.producao, campaignId: "camp-beneficios", title: "Revisar segmentação de público", percentComplete: 25, priority: 5, createdOffset: -8, modifiedOffset: -8, dueOffset: -2, assignees: ["Camila Pessoa"] },
  { id: "t-beneficios-4", bucketId: BUCKET_ID.aprovacao, campaignId: "camp-beneficios", title: "Aprovar peça visual com jurídico", percentComplete: 70, priority: 5, createdOffset: -6, modifiedOffset: -1, dueOffset: 5, assignees: ["Mariana da Silva"] },
  { id: "t-beneficios-5", bucketId: BUCKET_ID.agendamento, campaignId: "camp-beneficios", title: "Agendar disparo na intranet", percentComplete: 85, priority: 5, createdOffset: -4, modifiedOffset: -1, dueOffset: 6, assignees: ["Camila Pessoa"] },
  { id: "t-beneficios-6", bucketId: BUCKET_ID.backlog, campaignId: "camp-beneficios", title: "Publicar banner na home", percentComplete: 0, priority: 3, createdOffset: -3, modifiedOffset: -3, dueOffset: 10, assignees: ["Camila Pessoa"] },

  // --- Campanha de segurança (crítica, vencendo em 2 dias) -------------------
  { id: "t-seguranca-1", bucketId: BUCKET_ID.concluido, campaignId: "camp-seguranca", title: "Briefing com fornecedor de brindes", percentComplete: 100, priority: 3, createdOffset: -29, modifiedOffset: -27, completedOffset: -27, dueOffset: -27, assignees: ["Mariana da Silva"] },
  { id: "t-seguranca-2", bucketId: BUCKET_ID.concluido, campaignId: "camp-seguranca", title: "Definir cronograma de publicação", percentComplete: 100, priority: 3, createdOffset: -27, modifiedOffset: -25, completedOffset: -25, dueOffset: -25, assignees: ["Mariana da Silva"] },
  { id: "t-seguranca-3", bucketId: BUCKET_ID.producao, campaignId: "camp-seguranca", title: "Criar arte para banner de segurança", percentComplete: 60, priority: 5, createdOffset: -14, modifiedOffset: -2, dueOffset: 1, assignees: ["Larissa Nascimento"] },
  {
    id: "t-seguranca-4",
    bucketId: BUCKET_ID.aprovacao,
    campaignId: "camp-seguranca",
    title: "Aprovar peça visual com jurídico",
    percentComplete: 70,
    priority: 9,
    createdOffset: -10,
    modifiedOffset: -5,
    dueOffset: 2,
    assignees: ["Mariana da Silva"],
    isBlocked: true,
    blockerType: "aguardando aprovação jurídica",
    blockedSinceOffset: -5,
    dependencyOwner: "Jurídico",
    nextAction: "Cobrar retorno do jurídico até 15/08",
    labels: ["urgente", "aguardando aprovação"],
  },
  { id: "t-seguranca-5", bucketId: BUCKET_ID.backlog, campaignId: "camp-seguranca", title: "Imprimir material para pontos físicos", percentComplete: 0, priority: 9, createdOffset: -5, modifiedOffset: -5, dueOffset: 1, assignees: [], labels: ["urgente"] },
  { id: "t-seguranca-6", bucketId: BUCKET_ID.agendamento, campaignId: "camp-seguranca", title: "Publicar comunicado na intranet", percentComplete: 85, priority: 5, createdOffset: -4, modifiedOffset: -1, dueOffset: 3, assignees: ["Thaina Nunes"] },
  { id: "t-seguranca-7", bucketId: BUCKET_ID.planejamento, campaignId: "camp-seguranca", title: "Distribuir material impresso nas unidades", percentComplete: 15, priority: 5, createdOffset: -6, modifiedOffset: -1, dueOffset: 6, assignees: ["Larissa Nascimento", "Camila Pessoa"] },
  { id: "t-seguranca-8", bucketId: BUCKET_ID.producao, campaignId: "camp-seguranca", title: "Gravar vídeo institucional sobre segurança", percentComplete: 40, priority: 5, createdOffset: -9, modifiedOffset: -3, dueOffset: 4, assignees: ["Hector Kodi"] },

  // --- Evento corporativo (planejamento, atrasado e com bloqueios) -----------
  { id: "t-evento-1", bucketId: BUCKET_ID.concluido, campaignId: "camp-evento-corporativo", title: "Definir conceito do evento", percentComplete: 100, priority: 3, createdOffset: -43, modifiedOffset: -40, completedOffset: -40, dueOffset: -40, assignees: ["Hector Kodi"] },
  { id: "t-evento-2", bucketId: BUCKET_ID.producao, campaignId: "camp-evento-corporativo", title: "Selecionar fornecedor de brindes", percentComplete: 30, priority: 5, createdOffset: -20, modifiedOffset: -10, dueOffset: 15, assignees: ["Hector Kodi"] },
  {
    id: "t-evento-3",
    bucketId: BUCKET_ID.aprovacao,
    campaignId: "camp-evento-corporativo",
    title: "Negociar contrato com fornecedor de brindes",
    percentComplete: 20,
    priority: 5,
    createdOffset: -18,
    modifiedOffset: -9,
    dueOffset: 10,
    assignees: ["Hector Kodi"],
    isBlocked: true,
    blockerType: "aguardando retorno do fornecedor",
    blockedSinceOffset: -9,
    dependencyOwner: "Fornecedor XYZ Brindes",
    nextAction: "Cobrar retorno do fornecedor por e-mail",
    labels: ["aguardando fornecedor"],
  },
  { id: "t-evento-4", bucketId: BUCKET_ID.aprovacao, campaignId: "camp-evento-corporativo", title: "Aprovar orçamento com financeiro", percentComplete: 40, priority: 5, createdOffset: -15, modifiedOffset: -15, dueOffset: -4, assignees: ["Mariana da Silva"] },
  { id: "t-evento-5", bucketId: BUCKET_ID.backlog, campaignId: "camp-evento-corporativo", title: "Briefing com fornecedor de estrutura", percentComplete: 0, priority: 3, createdOffset: -6, modifiedOffset: -6, dueOffset: 18, assignees: [] },
  { id: "t-evento-6", bucketId: BUCKET_ID.planejamento, campaignId: "camp-evento-corporativo", title: "Definir cronograma do evento", percentComplete: 20, priority: 3, createdOffset: -12, modifiedOffset: -3, dueOffset: 8, assignees: ["Hector Kodi", "Caroline Verdinassi"] },
  { id: "t-evento-7", bucketId: BUCKET_ID.backlog, campaignId: "camp-evento-corporativo", title: "Criar peça de convite digital", percentComplete: 0, priority: 3, createdOffset: -3, modifiedOffset: -3, dueOffset: 16, assignees: ["Larissa Nascimento"] },
  { id: "t-evento-8", bucketId: BUCKET_ID.briefing, campaignId: "camp-evento-corporativo", title: "Alinhar pauta de discursos com liderança", percentComplete: 10, priority: 5, createdOffset: -5, modifiedOffset: -2, dueOffset: 12, assignees: ["Mariana da Silva"] },

  // --- Pesquisa de clima -------------------------------------------------------
  { id: "t-pesquisa-1", bucketId: BUCKET_ID.concluido, campaignId: "camp-pesquisa-clima", title: "Definir instrumento de pesquisa", percentComplete: 100, priority: 3, createdOffset: -12, modifiedOffset: -10, completedOffset: -10, dueOffset: -10, assignees: ["Caroline Verdinassi"] },
  { id: "t-pesquisa-2", bucketId: BUCKET_ID.producao, campaignId: "camp-pesquisa-clima", title: "Configurar enquete de satisfação", percentComplete: 65, priority: 5, createdOffset: -8, modifiedOffset: -1, dueOffset: 5, assignees: ["Caroline Verdinassi"] },
  { id: "t-pesquisa-3", bucketId: BUCKET_ID.aprovacao, campaignId: "camp-pesquisa-clima", title: "Redigir comunicado de convite à pesquisa", percentComplete: 75, priority: 5, createdOffset: -6, modifiedOffset: -1, dueOffset: 4, assignees: ["Caroline Verdinassi", "Sarah dos Santos"] },
  { id: "t-pesquisa-4", bucketId: BUCKET_ID.agendamento, campaignId: "camp-pesquisa-clima", title: "Agendar disparo por e-mail", percentComplete: 90, priority: 5, createdOffset: -4, modifiedOffset: -1, dueOffset: 6, assignees: ["Caroline Verdinassi"] },
  { id: "t-pesquisa-5", bucketId: BUCKET_ID.planejamento, campaignId: "camp-pesquisa-clima", title: "Definir plano de divulgação da pesquisa", percentComplete: 35, priority: 3, createdOffset: -7, modifiedOffset: -2, dueOffset: 9, assignees: ["Caroline Verdinassi"] },
  { id: "t-pesquisa-6", bucketId: BUCKET_ID.backlog, campaignId: "camp-pesquisa-clima", title: "Elaborar roteiro para apresentação dos resultados", percentComplete: 0, priority: 1, createdOffset: -2, modifiedOffset: -2, dueOffset: 30, assignees: ["Caroline Verdinassi"] },

  // --- Campanha de reconhecimento ----------------------------------------------
  { id: "t-reconhecimento-1", bucketId: BUCKET_ID.concluido, campaignId: "camp-reconhecimento", title: "Definir critérios de reconhecimento do mês", percentComplete: 100, priority: 3, createdOffset: -34, modifiedOffset: -30, completedOffset: -30, dueOffset: -30, assignees: ["Sarah dos Santos"] },
  { id: "t-reconhecimento-2", bucketId: BUCKET_ID.agendamento, campaignId: "camp-reconhecimento", title: "Criar peça para Teams", percentComplete: 90, priority: 5, createdOffset: -6, modifiedOffset: -1, dueOffset: 3, assignees: ["Sarah dos Santos"] },
  { id: "t-reconhecimento-3", bucketId: BUCKET_ID.producao, campaignId: "camp-reconhecimento", title: "Publicar comunicado na intranet", percentComplete: 55, priority: 3, createdOffset: -5, modifiedOffset: -1, dueOffset: 6, assignees: ["Sarah dos Santos"] },
  { id: "t-reconhecimento-4", bucketId: BUCKET_ID.aprovacao, campaignId: "camp-reconhecimento", title: "Aprovar lista de indicados com liderança", percentComplete: 70, priority: 3, createdOffset: -4, modifiedOffset: -1, dueOffset: 5, assignees: ["Mariana da Silva", "Sarah dos Santos"] },
  { id: "t-reconhecimento-5", bucketId: BUCKET_ID.backlog, campaignId: "camp-reconhecimento", title: "Planejar edição do próximo mês", percentComplete: 0, priority: 1, createdOffset: -1, modifiedOffset: -1, dueOffset: 25, assignees: ["Sarah dos Santos"] },

  // --- Comunicação de resultados -------------------------------------------------
  { id: "t-resultados-1", bucketId: BUCKET_ID.producao, campaignId: "camp-comunicacao-resultados", title: "Coletar dados consolidados de RH", percentComplete: 40, priority: 5, createdOffset: -8, modifiedOffset: -8, dueOffset: -1, assignees: ["Mariana da Silva"] },
  { id: "t-resultados-2", bucketId: BUCKET_ID.producao, campaignId: "camp-comunicacao-resultados", title: "Montar apresentação para liderança", percentComplete: 30, priority: 5, createdOffset: -6, modifiedOffset: -1, dueOffset: 1, assignees: ["Thaina Nunes"] },
  { id: "t-resultados-3", bucketId: BUCKET_ID.aprovacao, campaignId: "camp-comunicacao-resultados", title: "Aprovar apresentação com diretoria", percentComplete: 10, priority: 9, createdOffset: -3, modifiedOffset: -1, dueOffset: 6, assignees: ["Mariana da Silva"] },
  { id: "t-resultados-4", bucketId: BUCKET_ID.planejamento, campaignId: "camp-comunicacao-resultados", title: "Definir cronograma de comunicação dos resultados", percentComplete: 20, priority: 3, createdOffset: -5, modifiedOffset: -2, dueOffset: 8, assignees: ["Mariana da Silva"] },
  { id: "t-resultados-5", bucketId: BUCKET_ID.backlog, campaignId: "camp-comunicacao-resultados", title: "Redigir comunicado institucional", percentComplete: 0, priority: 3, createdOffset: -2, modifiedOffset: -2, dueOffset: 12, assignees: [] },
  { id: "t-resultados-6", bucketId: BUCKET_ID.backlog, campaignId: "camp-comunicacao-resultados", title: "Agendar publicação no portal", percentComplete: 0, priority: 1, createdOffset: -1, modifiedOffset: -1, dueOffset: 15, assignees: ["Thaina Nunes"] },

  // --- Atualização de conteúdo no portal ------------------------------------------
  { id: "t-portal-1", bucketId: BUCKET_ID.producao, campaignId: "camp-atualizacao-portal", title: "Atualizar página de benefícios no portal", percentComplete: 50, priority: 3, createdOffset: -20, modifiedOffset: -20, dueOffset: -6, assignees: ["Hector Kodi"] },
  { id: "t-portal-2", bucketId: BUCKET_ID.backlog, campaignId: "camp-atualizacao-portal", title: "Revisar links quebrados no portal", percentComplete: 0, priority: 1, createdOffset: -25, modifiedOffset: -15, dueOffset: 20, assignees: ["Camila Pessoa"] },
  { id: "t-portal-3", bucketId: BUCKET_ID.concluido, campaignId: "camp-atualizacao-portal", title: "Atualizar organograma no portal", percentComplete: 100, priority: 1, createdOffset: -40, modifiedOffset: -35, completedOffset: -35, dueOffset: -35, assignees: ["Hector Kodi"] },
  { id: "t-portal-4", bucketId: BUCKET_ID.planejamento, campaignId: "camp-atualizacao-portal", title: "Revisar textos institucionais com RH", percentComplete: 25, priority: 3, createdOffset: -9, modifiedOffset: -2, dueOffset: 10, assignees: ["Hector Kodi", "Camila Pessoa"] },
  { id: "t-portal-5", bucketId: BUCKET_ID.agendamento, campaignId: "camp-atualizacao-portal", title: "Publicar nova seção de políticas internas", percentComplete: 85, priority: 3, createdOffset: -5, modifiedOffset: -1, dueOffset: 7, assignees: ["Larissa Nascimento"] },
  { id: "t-portal-6", bucketId: BUCKET_ID.backlog, campaignId: "camp-atualizacao-portal", title: "Auditar conteúdo desatualizado no portal", percentComplete: 0, priority: 1, createdOffset: -1, modifiedOffset: -1, dueOffset: 30, assignees: [] },

  // --- Produção de peças de comunicação --------------------------------------------
  { id: "t-pecas-1", bucketId: BUCKET_ID.concluido, campaignId: "camp-pecas-comunicacao", title: "Alinhar calendário editorial do mês", percentComplete: 100, priority: 3, createdOffset: -19, modifiedOffset: -17, completedOffset: -17, dueOffset: -17, assignees: ["Larissa Nascimento"] },
  { id: "t-pecas-2", bucketId: BUCKET_ID.producao, campaignId: "camp-pecas-comunicacao", title: "Criar peças para campanha de segurança", percentComplete: 45, priority: 5, createdOffset: -10, modifiedOffset: -3, dueOffset: 4, assignees: ["Larissa Nascimento"] },
  { id: "t-pecas-3", bucketId: BUCKET_ID.aprovacao, campaignId: "camp-pecas-comunicacao", title: "Revisar peça com jurídico", percentComplete: 60, priority: 5, createdOffset: -7, modifiedOffset: -1, dueOffset: 5, assignees: ["Mariana da Silva"] },
  { id: "t-pecas-4", bucketId: BUCKET_ID.agendamento, campaignId: "camp-pecas-comunicacao", title: "Testar disparo em ambiente de homologação", percentComplete: 90, priority: 3, createdOffset: -3, modifiedOffset: -1, dueOffset: 3, assignees: ["Larissa Nascimento"] },
  { id: "t-pecas-5", bucketId: BUCKET_ID.backlog, campaignId: "camp-pecas-comunicacao", title: "Solicitar orçamento de material impresso", percentComplete: 0, priority: 3, createdOffset: -4, modifiedOffset: -4, dueOffset: 12, assignees: ["Larissa Nascimento"] },
  { id: "t-pecas-6", bucketId: BUCKET_ID.planejamento, campaignId: "camp-pecas-comunicacao", title: "Atualizar identidade visual do template de e-mail", percentComplete: 15, priority: 1, createdOffset: -5, modifiedOffset: -2, dueOffset: 20, assignees: ["Camila Pessoa"] },
];

export const TEAM_TASKS: TeamTask[] = SPECS.map(makeTask);

export function findTeamTask(id: string): TeamTask | undefined {
  return TEAM_TASKS.find((task) => task.id === id);
}
