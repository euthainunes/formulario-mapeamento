import { TeamDocument } from "@/types/team-management";
import { relativeIso } from "./_helpers";
import { TEAM_CAMPAIGNS } from "./campaigns.mock";

/**
 * Documentos do SharePoint (drive items), seguindo a convenção de nome
 * definida pela Bruna: [ANO]_[CAMPANHA]_[CANAL]_[TIPO]_[VERSAO].ext
 *
 * `isStale` é CALCULADO (não hardcoded): true quando não há alteração há
 * mais de 45 dias E a campanha vinculada ainda está ativa (status
 * "planejamento" ou "em_andamento") — documento parado numa campanha viva é
 * sinal de risco de governança documental; numa campanha já concluída, não.
 *
 * Propositalmente, a campanha "Comunicação de resultados" não tem nenhum
 * documento vinculado ainda (está em planejamento, com uma tarefa em
 * Aprovação) — isso alimenta o alerta de "documento ausente em etapa de
 * aprovação" (ver computeTeamAlerts em ./alerts.mock.ts).
 */
const STALE_THRESHOLD_DAYS = 45;

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  png: "image/png",
  jpg: "image/jpeg",
};

interface DocSpec {
  id: string;
  name: string; // sem extensão
  ext: keyof typeof MIME_BY_EXT;
  campaignId?: string;
  taskId?: string;
  createdOffset: number;
  modifiedOffset: number;
  sizeBytes: number;
  authorName: string;
}

function makeDoc(spec: DocSpec): TeamDocument {
  const campaign = spec.campaignId ? TEAM_CAMPAIGNS.find((c) => c.id === spec.campaignId) : undefined;
  const campaignActive = campaign ? campaign.status === "planejamento" || campaign.status === "em_andamento" : false;
  const isStale = campaignActive && -spec.modifiedOffset > STALE_THRESHOLD_DAYS;
  const fileName = `${spec.name}.${spec.ext}`;
  return {
    id: spec.id,
    name: fileName,
    campaignId: spec.campaignId,
    taskId: spec.taskId,
    webUrl: `https://beehome365.sharepoint.com/sites/comunicacao/Documentos/${fileName}`,
    path: `/sites/comunicacao/Documentos Compartilhados/${campaign?.name ?? "Geral"}/${fileName}`,
    mimeType: MIME_BY_EXT[spec.ext],
    sizeBytes: spec.sizeBytes,
    createdDateTime: relativeIso(spec.createdOffset, 11, 0),
    lastModifiedDateTime: relativeIso(spec.modifiedOffset, 11, 0),
    lastModifiedByName: spec.authorName,
    isStale,
  };
}

const SPECS: DocSpec[] = [
  // Campanha de Dia dos Pais (concluída — documentos parados não contam como isStale)
  { id: "doc-1", name: "2026_CampanhaDiaDosPais_Evento_Briefing_v1", ext: "docx", campaignId: "camp-dia-dos-pais", createdOffset: -42, modifiedOffset: -41, sizeBytes: 182_000, authorName: "Mariana Souza" },
  { id: "doc-2", name: "2026_CampanhaDiaDosPais_Email_Copy_v2", ext: "docx", campaignId: "camp-dia-dos-pais", taskId: "t-dia-dos-pais-2", createdOffset: -37, modifiedOffset: -34, sizeBytes: 95_000, authorName: "Camila Duarte" },
  { id: "doc-3", name: "2026_CampanhaDiaDosPais_Intranet_Banner_v2", ext: "png", campaignId: "camp-dia-dos-pais", taskId: "t-dia-dos-pais-2", createdOffset: -32, modifiedOffset: -29, sizeBytes: 1_450_000, authorName: "Camila Duarte" },
  { id: "doc-4", name: "2026_CampanhaDiaDosPais_Evento_RelatorioResultados_v1", ext: "pptx", campaignId: "camp-dia-dos-pais", taskId: "t-dia-dos-pais-6", createdOffset: -9, modifiedOffset: -8, sizeBytes: 3_200_000, authorName: "Mariana Souza" },

  // Newsletter interna (recorrente)
  { id: "doc-5", name: "2026_NewsletterInterna_Email_Pauta_v1", ext: "docx", campaignId: "camp-newsletter-interna", taskId: "t-newsletter-1", createdOffset: -6, modifiedOffset: -1, sizeBytes: 64_000, authorName: "Thainá Nunes" },
  { id: "doc-6", name: "2026_NewsletterInterna_Email_Copy_v3", ext: "docx", campaignId: "camp-newsletter-interna", taskId: "t-newsletter-2", createdOffset: -5, modifiedOffset: -1, sizeBytes: 71_000, authorName: "Thainá Nunes" },
  { id: "doc-7", name: "2026_NewsletterInterna_Email_RelatorioMetricas_v1", ext: "xlsx", campaignId: "camp-newsletter-interna", taskId: "t-newsletter-4", createdOffset: -20, modifiedOffset: -14, sizeBytes: 128_000, authorName: "Hector Ramos" },
  { id: "doc-8", name: "2026_NewsletterInterna_Email_TemplateVisual_v4", ext: "pptx", campaignId: "camp-newsletter-interna", createdOffset: -95, modifiedOffset: -30, sizeBytes: 980_000, authorName: "Sarah Lima" },

  // Comunicação de benefícios
  { id: "doc-9", name: "2026_ComunicacaoBeneficios_Email_Briefing_v1", ext: "docx", campaignId: "camp-beneficios", taskId: "t-beneficios-1", createdOffset: -24, modifiedOffset: -22, sizeBytes: 88_000, authorName: "Camila Duarte" },
  { id: "doc-10", name: "2026_ComunicacaoBeneficios_Email_Peca_v3", ext: "pdf", campaignId: "camp-beneficios", taskId: "t-beneficios-4", createdOffset: -9, modifiedOffset: -2, sizeBytes: 540_000, authorName: "Camila Duarte" },
  { id: "doc-11", name: "2026_ComunicacaoBeneficios_Intranet_ListaElegiveis_v2", ext: "xlsx", campaignId: "camp-beneficios", taskId: "t-beneficios-3", createdOffset: -10, modifiedOffset: -8, sizeBytes: 210_000, authorName: "Camila Duarte" },
  { id: "doc-12", name: "2026_ComunicacaoBeneficios_Intranet_Banner_v1", ext: "png", campaignId: "camp-beneficios", taskId: "t-beneficios-6", createdOffset: -3, modifiedOffset: -3, sizeBytes: 1_100_000, authorName: "Camila Duarte" },

  // Campanha de segurança
  { id: "doc-13", name: "2026_CampanhaSeguranca_Intranet_Briefing_v1", ext: "docx", campaignId: "camp-seguranca", taskId: "t-seguranca-3", createdOffset: -29, modifiedOffset: -27, sizeBytes: 102_000, authorName: "Mariana Souza" },
  { id: "doc-14", name: "2026_CampanhaSeguranca_Intranet_Banner_v2", ext: "pdf", campaignId: "camp-seguranca", taskId: "t-seguranca-4", createdOffset: -13, modifiedOffset: -5, sizeBytes: 620_000, authorName: "Larissa Prado" },
  { id: "doc-15", name: "2026_CampanhaSeguranca_Impresso_Cartaz_v1", ext: "pdf", campaignId: "camp-seguranca", taskId: "t-seguranca-3", createdOffset: -12, modifiedOffset: -6, sizeBytes: 780_000, authorName: "Larissa Prado" },
  { id: "doc-16", name: "2026_CampanhaSeguranca_Evento_RoteiroPauta_v1", ext: "docx", campaignId: "camp-seguranca", taskId: "t-seguranca-8", createdOffset: -9, modifiedOffset: -3, sizeBytes: 58_000, authorName: "Hector Ramos" },
  { id: "doc-17", name: "2026_CampanhaSeguranca_Intranet_ChecklistDistribuicao_v1", ext: "xlsx", campaignId: "camp-seguranca", taskId: "t-seguranca-7", createdOffset: -6, modifiedOffset: -1, sizeBytes: 44_000, authorName: "Larissa Prado" },

  // Evento corporativo
  { id: "doc-18", name: "2026_EventoCorporativo_Evento_Briefing_v1", ext: "docx", campaignId: "camp-evento-corporativo", taskId: "t-evento-1", createdOffset: -43, modifiedOffset: -40, sizeBytes: 130_000, authorName: "Hector Ramos" },
  { id: "doc-19", name: "2026_EventoCorporativo_Evento_Proposta_v1", ext: "pdf", campaignId: "camp-evento-corporativo", taskId: "t-evento-3", createdOffset: -17, modifiedOffset: -9, sizeBytes: 310_000, authorName: "Hector Ramos" },
  { id: "doc-20", name: "2026_EventoCorporativo_Evento_OrcamentoConsolidado_v2", ext: "xlsx", campaignId: "camp-evento-corporativo", taskId: "t-evento-4", createdOffset: -16, modifiedOffset: -15, sizeBytes: 96_000, authorName: "Mariana Souza" },
  { id: "doc-21", name: "2026_EventoCorporativo_Teams_ApresentacaoConceito_v1", ext: "pptx", campaignId: "camp-evento-corporativo", createdOffset: -80, modifiedOffset: -35, sizeBytes: 4_100_000, authorName: "Hector Ramos" },

  // Pesquisa de clima
  { id: "doc-22", name: "2026_PesquisaClima_Email_Instrumento_v1", ext: "docx", campaignId: "camp-pesquisa-clima", taskId: "t-pesquisa-1", createdOffset: -12, modifiedOffset: -10, sizeBytes: 76_000, authorName: "Carol Ferraz" },
  { id: "doc-23", name: "2026_PesquisaClima_Intranet_ComunicadoConvite_v2", ext: "docx", campaignId: "camp-pesquisa-clima", taskId: "t-pesquisa-3", createdOffset: -6, modifiedOffset: -1, sizeBytes: 51_000, authorName: "Carol Ferraz" },
  { id: "doc-24", name: "2026_PesquisaClima_Intranet_PlanoDivulgacao_v1", ext: "pptx", campaignId: "camp-pesquisa-clima", taskId: "t-pesquisa-5", createdOffset: -7, modifiedOffset: -2, sizeBytes: 1_050_000, authorName: "Carol Ferraz" },

  // Campanha de reconhecimento
  { id: "doc-25", name: "2026_CampanhaReconhecimento_Intranet_Criterios_v1", ext: "docx", campaignId: "camp-reconhecimento", taskId: "t-reconhecimento-1", createdOffset: -34, modifiedOffset: -30, sizeBytes: 48_000, authorName: "Sarah Lima" },
  { id: "doc-26", name: "2026_CampanhaReconhecimento_Teams_Peca_v2", ext: "png", campaignId: "camp-reconhecimento", taskId: "t-reconhecimento-2", createdOffset: -6, modifiedOffset: -1, sizeBytes: 890_000, authorName: "Sarah Lima" },
  { id: "doc-27", name: "2026_CampanhaReconhecimento_Intranet_ListaIndicados_v1", ext: "xlsx", campaignId: "camp-reconhecimento", taskId: "t-reconhecimento-4", createdOffset: -4, modifiedOffset: -1, sizeBytes: 33_000, authorName: "Mariana Souza" },

  // Atualização de conteúdo no portal
  { id: "doc-28", name: "2026_AtualizacaoPortal_Portal_ConteudoBeneficios_v3", ext: "docx", campaignId: "camp-atualizacao-portal", taskId: "t-portal-1", createdOffset: -20, modifiedOffset: -20, sizeBytes: 42_000, authorName: "Hector Ramos" },
  { id: "doc-29", name: "2026_AtualizacaoPortal_Portal_AuditoriaLinks_v1", ext: "xlsx", campaignId: "camp-atualizacao-portal", taskId: "t-portal-2", createdOffset: -25, modifiedOffset: -60, sizeBytes: 21_000, authorName: "Hector Ramos" },
  { id: "doc-30", name: "2026_AtualizacaoPortal_Portal_TextosInstitucionais_v2", ext: "docx", campaignId: "camp-atualizacao-portal", taskId: "t-portal-4", createdOffset: -9, modifiedOffset: -55, sizeBytes: 58_000, authorName: "Camila Duarte" },

  // Produção de peças de comunicação
  { id: "doc-31", name: "2026_PecasComunicacao_Impresso_CalendarioEditorial_v1", ext: "xlsx", campaignId: "camp-pecas-comunicacao", taskId: "t-pecas-1", createdOffset: -19, modifiedOffset: -17, sizeBytes: 39_000, authorName: "Larissa Prado" },
  { id: "doc-32", name: "2026_PecasComunicacao_Intranet_PecaSeguranca_v2", ext: "png", campaignId: "camp-pecas-comunicacao", taskId: "t-pecas-2", createdOffset: -10, modifiedOffset: -3, sizeBytes: 1_320_000, authorName: "Larissa Prado" },
  { id: "doc-33", name: "2026_PecasComunicacao_Impresso_RevisaoJuridica_v1", ext: "pdf", campaignId: "camp-pecas-comunicacao", taskId: "t-pecas-3", createdOffset: -7, modifiedOffset: -1, sizeBytes: 640_000, authorName: "Mariana Souza" },
  { id: "doc-34", name: "2026_PecasComunicacao_Email_TemplateVisual_v5", ext: "pptx", campaignId: "camp-pecas-comunicacao", taskId: "t-pecas-6", createdOffset: -70, modifiedOffset: -50, sizeBytes: 2_400_000, authorName: "Camila Duarte" },
];

export const TEAM_DOCUMENTS: TeamDocument[] = SPECS.map(makeDoc);
