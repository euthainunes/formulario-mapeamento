import { TeamTaskDetails } from "@/types/team-management";

/**
 * Detalhes (descrição, checklist, referências) para as tarefas mais
 * relevantes do painel — usadas nos drill-downs do Quadro, da lista de
 * Tarefas e do detalhe de Campanha. Nem toda tarefa do Planner tem esse
 * nível de detalhe preenchido na vida real; aqui cobrimos as que mais
 * aparecem em exemplos de alerta/risco.
 */
export const TEAM_TASK_DETAILS: TeamTaskDetails[] = [
  {
    taskId: "t-seguranca-4",
    description:
      "Peça visual da campanha de segurança (banner + cartaz) precisa de aprovação do jurídico antes da publicação, por conter orientações que podem gerar responsabilização em caso de acidente de trabalho.",
    checklist: [
      { title: "Enviar arte final para o jurídico", isChecked: true },
      { title: "Incluir referência à NR aplicável", isChecked: true },
      { title: "Receber parecer formal do jurídico", isChecked: false },
      { title: "Ajustar peça conforme apontamentos, se houver", isChecked: false },
    ],
    references: [
      { label: "Arte final (SharePoint)", url: "https://beehome365.sharepoint.com/sites/comunicacao/Documentos/2026_CampanhaSeguranca_Intranet_Banner_v2.pdf" },
      { label: "Solicitação de parecer jurídico", url: "https://tasks.office.com/beehome365.onmicrosoft.com/Home/Task/t-seguranca-4/juridico" },
    ],
  },
  {
    taskId: "t-seguranca-3",
    description: "Arte do banner principal da campanha de segurança, para publicação na intranet e impressão nas unidades operacionais.",
    checklist: [
      { title: "Definir paleta e ícones de segurança", isChecked: true },
      { title: "Produzir arte em alta resolução", isChecked: true },
      { title: "Adaptar para formato impresso (A3)", isChecked: false },
    ],
    references: [{ label: "Briefing da campanha", url: "https://beehome365.sharepoint.com/sites/comunicacao/Documentos/2026_CampanhaSeguranca_Intranet_Briefing_v1.docx" }],
  },
  {
    taskId: "t-seguranca-5",
    description: "Impressão do material de segurança para distribuição física nos pontos de maior circulação das unidades operacionais. Depende de definição de responsável e envio para gráfica com pelo menos 3 dias de antecedência.",
    checklist: [
      { title: "Definir quantidade por unidade", isChecked: false },
      { title: "Enviar arquivo para gráfica", isChecked: false },
      { title: "Confirmar prazo de entrega da gráfica", isChecked: false },
    ],
    references: [],
  },
  {
    taskId: "t-evento-3",
    description: "Negociação de contrato com fornecedor de brindes para o evento corporativo. Aguardando retorno comercial do fornecedor há mais de uma semana.",
    checklist: [
      { title: "Enviar briefing de quantidade e orçamento", isChecked: true },
      { title: "Receber proposta comercial", isChecked: true },
      { title: "Negociar condições de pagamento", isChecked: false },
      { title: "Assinar contrato", isChecked: false },
    ],
    references: [{ label: "Proposta recebida (v1)", url: "https://beehome365.sharepoint.com/sites/comunicacao/Documentos/2026_EventoCorporativo_Evento_Proposta_v1.pdf" }],
  },
  {
    taskId: "t-evento-4",
    description: "Aprovação do orçamento do evento corporativo junto ao financeiro — pré-requisito para fechar contratos com fornecedores.",
    checklist: [
      { title: "Consolidar estimativa de custos", isChecked: true },
      { title: "Enviar para aprovação do financeiro", isChecked: true },
      { title: "Registrar aprovação formal", isChecked: false },
    ],
    references: [],
  },
  {
    taskId: "t-newsletter-4",
    description: "Consolidação das métricas de abertura e cliques da edição anterior da newsletter, para compor o relatório mensal de engajamento.",
    checklist: [
      { title: "Exportar dados da ferramenta de disparo", isChecked: true },
      { title: "Calcular taxa de abertura e cliques", isChecked: false },
      { title: "Enviar resumo para a coordenação", isChecked: false },
    ],
    references: [],
  },
  {
    taskId: "t-newsletter-3",
    description: "Revisão da lista de segmentação de público da newsletter, para evitar envios duplicados a colaboradores desligados ou em outra unidade.",
    checklist: [
      { title: "Cruzar lista com base atualizada de RH", isChecked: false },
      { title: "Remover contatos inativos", isChecked: false },
    ],
    references: [],
  },
  {
    taskId: "t-beneficios-3",
    description: "Revisão da segmentação de público da comunicação de benefícios, considerando diferenças de elegibilidade entre matriz e filiais.",
    checklist: [
      { title: "Validar lista de elegíveis com RH", isChecked: true },
      { title: "Ajustar segmentação na ferramenta de disparo", isChecked: false },
    ],
    references: [],
  },
  {
    taskId: "t-beneficios-4",
    description: "Aprovação jurídica da peça de comunicação de benefícios, por envolver detalhes de plano de saúde e política de reembolso.",
    checklist: [
      { title: "Enviar peça para o jurídico", isChecked: true },
      { title: "Receber retorno", isChecked: false },
    ],
    references: [{ label: "Peça em revisão", url: "https://beehome365.sharepoint.com/sites/comunicacao/Documentos/2026_ComunicacaoBeneficios_Email_Peca_v3.pdf" }],
  },
  {
    taskId: "t-resultados-1",
    description: "Coleta de dados consolidados com RH (headcount, turnover, clima) para compor a comunicação de resultados do trimestre.",
    checklist: [
      { title: "Solicitar planilha consolidada ao RH", isChecked: true },
      { title: "Validar números com liderança de RH", isChecked: false },
    ],
    references: [],
  },
  {
    taskId: "t-resultados-2",
    description: "Montagem da apresentação de resultados do trimestre para a liderança, com base nos dados consolidados de RH e financeiro.",
    checklist: [
      { title: "Estruturar roteiro da apresentação", isChecked: true },
      { title: "Inserir gráficos e indicadores", isChecked: false },
      { title: "Revisar com a coordenação antes do envio", isChecked: false },
    ],
    references: [],
  },
  {
    taskId: "t-resultados-3",
    description: "Aprovação final da apresentação de resultados junto à diretoria, antes da comunicação para toda a empresa.",
    checklist: [{ title: "Agendar reunião de validação com diretoria", isChecked: false }],
    references: [],
  },
  {
    taskId: "t-portal-1",
    description: "Atualização da página de benefícios no portal do colaborador, para refletir os novos planos vigentes a partir deste ciclo.",
    checklist: [
      { title: "Levantar conteúdo atualizado com RH", isChecked: true },
      { title: "Editar página no portal", isChecked: false },
      { title: "Validar publicação em ambiente de homologação", isChecked: false },
    ],
    references: [],
  },
  {
    taskId: "t-dia-dos-pais-6",
    description: "Registro de aprendizados (post-mortem) da Campanha de Dia dos Pais, para consulta em campanhas futuras de mesmo formato.",
    checklist: [
      { title: "Levantar métricas finais de alcance e engajamento", isChecked: true },
      { title: "Documentar pontos de melhoria com o time", isChecked: false },
    ],
    references: [],
  },
];

export function findTeamTaskDetails(taskId: string): TeamTaskDetails | undefined {
  return TEAM_TASK_DETAILS.find((d) => d.taskId === taskId);
}
