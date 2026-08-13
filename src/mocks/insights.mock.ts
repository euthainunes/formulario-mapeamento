import { InsightAnswer, InsightSummary } from "@/types/insight";

export const MOCK_AUTO_INSIGHTS: InsightSummary[] = [
  {
    id: "auto-1",
    text: "Os acessos à intranet cresceram nos últimos 30 dias em comparação ao período anterior, puxados principalmente por dispositivos desktop.",
    relatedDashboard: "/acessos",
  },
  {
    id: "auto-2",
    text: "O Pod de Tecnologia apresenta a maior taxa de participação entre os Pods monitorados neste período.",
    relatedDashboard: "/pods",
  },
  {
    id: "auto-3",
    text: "Conteúdos em formato de vídeo seguem com engajamento acima da média em relação a notícias em texto.",
    relatedDashboard: "/conteudos",
  },
];

export const MOCK_INSIGHT_ANSWERS: InsightAnswer[] = [
  {
    id: "q-acessos-mes",
    question: "Como estão os acessos à intranet no último mês?",
    keywords: ["acesso", "acessos", "login", "logins", "mes", "mês"],
    answer:
      "Nos últimos 30 dias, o volume de acessos manteve tendência de crescimento moderado em relação ao período anterior, com pico de uso concentrado entre 9h–11h e 14h–16h, em dias úteis. O dispositivo mais utilizado continua sendo o desktop.",
    periodAnalyzed: "Últimos 30 dias",
    metricsUsed: ["Total de acessos", "Horário de pico", "Distribuição por dispositivo"],
    relatedDashboardHref: "/acessos",
    relatedDashboardLabel: "Ver dashboard de Acessos",
    limitation: "Dados fictícios gerados para fins demonstrativos — não refletem acessos reais.",
  },
  {
    id: "q-conteudo-mais-visto",
    question: "Qual foi o conteúdo mais visualizado no período?",
    keywords: ["conteudo", "conteúdo", "noticia", "notícia", "visualizacao", "visualização", "mais visto", "views"],
    answer:
      "Entre os conteúdos publicados no período filtrado, os formatos de vídeo institucional e notícias sobre benefícios corporativos concentraram o maior número de visualizações, com desempenho acima da média geral de publicações.",
    periodAnalyzed: "Período selecionado nos filtros globais",
    metricsUsed: ["Visualizações por conteúdo", "Comparativo de desempenho"],
    relatedDashboardHref: "/conteudos",
    relatedDashboardLabel: "Ver dashboard de Conteúdos",
    limitation: "Ranking calculado apenas sobre publicações e não mede produtividade de autores individuais.",
  },
  {
    id: "q-engajamento-beezz",
    question: "Como está o engajamento com os Beezz?",
    keywords: ["beezz", "engajamento beezz", "curtidas beezz", "comentarios beezz"],
    answer:
      "Os Beezz seguem sendo um dos formatos com maior interação por publicação, concentrando volume relevante de curtidas e comentários no período, com destaque para publicações de reconhecimento entre times.",
    periodAnalyzed: "Período selecionado nos filtros globais",
    metricsUsed: ["Curtidas em Beezz", "Comentários em Beezz", "Ranking de criadores"],
    relatedDashboardHref: "/beezz",
    relatedDashboardLabel: "Ver dashboard de Beezz",
    limitation: "Não é utilizado para avaliar desempenho individual de colaboradores.",
  },
  {
    id: "q-pod-mais-acessado",
    question: "Qual Pod está com mais acessos atualmente?",
    keywords: ["pod", "pods", "mais acessado", "acesso pod"],
    answer:
      "O Pod de Tecnologia lidera em número absoluto de acessos no período, seguido de perto pelo Pod de Comunicação. Já o Pod Financeiro apresenta o menor volume relativo entre os Pods monitorados.",
    periodAnalyzed: "Período selecionado nos filtros globais",
    metricsUsed: ["Acessos por Pod", "Participação percentual"],
    relatedDashboardHref: "/pods",
    relatedDashboardLabel: "Ver dashboard de Pods",
    limitation: "Ranking de Pods não deve ser interpretado como avaliação de desempenho de equipes.",
  },
  {
    id: "q-alertas-abertos",
    question: "Existem alertas em aberto que eu deveria revisar?",
    keywords: ["alerta", "alertas", "aberto", "pendente", "revisar"],
    answer:
      "Sim. Há alertas com status 'novo' ou 'em análise' cadastrados no período, incluindo variações de acesso acima do limite configurado. Recomenda-se revisar o painel de alertas para priorização.",
    periodAnalyzed: "Situação atual (dados fictícios)",
    metricsUsed: ["Alertas por status", "Severidade"],
    relatedDashboardHref: "/administracao/alertas",
    relatedDashboardLabel: "Ver Administração de Alertas",
    limitation: "Alertas são gerados por regras simuladas, sem processamento real de dados da BeeHome.",
  },
  {
    id: "q-status-sincronizacao",
    question: "Quando foi a última sincronização de dados?",
    keywords: ["sincronizacao", "sincronização", "sync", "atualizacao", "atualização de dados"],
    answer:
      "A última sincronização simulada com a Intranet BeeHome foi concluída com status de sucesso. Para o histórico completo de execuções, consulte a área de Sincronizações na Administração.",
    periodAnalyzed: "Última execução registrada",
    metricsUsed: ["Status da sincronização", "Registros processados"],
    relatedDashboardHref: "/administracao/sincronizacoes",
    relatedDashboardLabel: "Ver Sincronizações",
    limitation: "Nenhuma sincronização real ocorre nesta versão demonstrativa.",
  },
];

export const SUGGESTED_QUESTIONS: string[] = MOCK_INSIGHT_ANSWERS.map((a) => a.question);

export function matchInsightAnswer(freeText: string): InsightAnswer | null {
  const normalized = freeText
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  let best: InsightAnswer | null = null;
  let bestScore = 0;
  for (const answer of MOCK_INSIGHT_ANSWERS) {
    let score = 0;
    for (const kw of answer.keywords) {
      const normKw = kw
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (normalized.includes(normKw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = answer;
    }
  }
  return bestScore > 0 ? best : null;
}
