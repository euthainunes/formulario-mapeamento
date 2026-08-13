import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../tenant/tenant-context.service';
import { calculateVariation } from '../common/metrics/variation.util';

/**
 * Camada de insights — IMPORTANTE: isto é uma primeira camada de REGRAS
 * DETERMINÍSTICAS sobre métricas já calculadas (comparações de período,
 * tendências simples, rankings e desvio-padrão para anomalias). NÃO chama
 * nenhum modelo de IA/LLM externo. Qualquer evolução para um motor de fato
 * "inteligente" (ex: linguagem natural livre, embeddings, LLM) é trabalho
 * futuro fora do escopo deste MVP.
 */
@Injectable()
export class InsightsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  getSuggestedQuestions(): string[] {
    return [
      'Como está a audiência nos últimos 7 dias comparado à semana anterior?',
      'Qual conteúdo teve mais curtidas este mês?',
      'Houve alguma anomalia nos acessos recentemente?',
      'Qual pod teve maior crescimento de participação?',
      'Como está a tendência de engajamento nas últimas semanas?',
    ];
  }

  async getAutoInsights() {
    const [comparativo, tendencia, ranking, anomalia] = await Promise.all([
      this.buildComparativoInsight(),
      this.buildTendenciaInsight(),
      this.buildRankingInsight(),
      this.buildAnomaliaInsight(),
    ]);

    const insights = [comparativo, tendencia, ranking, anomalia].filter((i): i is NonNullable<typeof i> => i !== null);

    // Persiste para trilha/histórico (AIInsight), best-effort.
    const tenantId = this.tenantContext.getTenantId();
    if (tenantId) {
      await Promise.all(
        insights.map((i) =>
          this.prisma.aIInsight
            .create({
              data: {
                tenantId,
                type: i.type,
                text: i.text,
                relatedDashboard: i.relatedDashboard,
                metricsUsed: i.metricsUsed as any,
                periodAnalyzed: i.periodAnalyzed,
              },
            })
            .catch(() => undefined),
        ),
      );
    }

    return insights.map((i, idx) => ({ id: `insight-${i.type}-${idx}`, text: i.text, relatedDashboard: i.relatedDashboard }));
  }

  async ask(question: string) {
    const normalized = question.toLowerCase();

    const rules: { keywords: string[]; build: () => Promise<Record<string, unknown> | null> }[] = [
      { keywords: ['audiência', 'audiencia', 'ativo', 'ativos'], build: () => this.answerAudience() },
      { keywords: ['acesso', 'acessos', 'login'], build: () => this.answerAccess() },
      { keywords: ['conteúdo', 'conteudo', 'notícia', 'noticia', 'curtida'], build: () => this.answerContentRanking() },
      { keywords: ['anomalia', 'anômalo', 'anomalo', 'pico', 'queda'], build: () => this.answerAnomaly() },
    ];

    const matched = rules.find((r) => r.keywords.some((k) => normalized.includes(k)));
    if (!matched) return null;

    const answer = await matched.build();
    if (!answer) return null;

    return {
      id: `answer-${Date.now()}`,
      question,
      keywords: matched.keywords.filter((k) => normalized.includes(k)),
      ...answer,
      limitation:
        'Resposta gerada por uma camada de regras determinísticas sobre métricas já calculadas — não é um modelo de IA/LLM real. Cobertura limitada às perguntas pré-mapeadas.',
    };
  }

  // ---- construtores de insight individuais ----

  private async buildComparativoInsight() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [current, previous] = await Promise.all([
      this.prisma.loginEvent.count({ where: { occurredAt: { gte: sevenDaysAgo, lte: now } } }),
      this.prisma.loginEvent.count({ where: { occurredAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    ]);

    const variation = calculateVariation(current, previous);
    if (!variation.comparable) return null;

    const direction = variation.direction === 'up' ? 'aumento' : variation.direction === 'down' ? 'queda' : 'estabilidade';
    return {
      type: 'comparativo' as const,
      text: `Os acessos dos últimos 7 dias somaram ${current}, uma ${direction} de ${Math.abs(variation.percentChange ?? 0).toFixed(1)}% frente aos 7 dias anteriores (${previous}).`,
      relatedDashboard: 'access',
      metricsUsed: ['audit.loginsByDate'],
      periodAnalyzed: '7d vs 7d anteriores',
    };
  }

  private async buildTendenciaInsight() {
    const days = 7;
    const points: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const count = await this.prisma.loginEvent.count({ where: { occurredAt: { gte: dayStart, lt: dayEnd } } });
      points.push({ date: dayStart.toISOString().slice(0, 10), count });
    }

    if (points.every((p) => p.count === 0)) return null;

    let increasing = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].count >= points[i - 1].count) increasing++;
    }
    const trendLabel = increasing >= days - 2 ? 'tendência de crescimento' : increasing <= 1 ? 'tendência de queda' : 'comportamento estável';

    return {
      type: 'tendencia' as const,
      text: `Nos últimos ${days} dias, os acessos diários mostram ${trendLabel} (${points.map((p) => p.count).join(' → ')}).`,
      relatedDashboard: 'access',
      metricsUsed: ['audit.loginsByDate'],
      periodAnalyzed: `últimos ${days} dias`,
    };
  }

  private async buildRankingInsight() {
    const topNews = await this.prisma.news.findMany({ orderBy: { likes: 'desc' }, take: 1 });
    if (topNews.length === 0 || topNews[0].likes === 0) return null;

    return {
      type: 'ranking' as const,
      text: `A notícia com melhor desempenho é "${topNews[0].title}", com ${topNews[0].likes} curtidas e ${topNews[0].comments} comentários.`,
      relatedDashboard: 'content',
      metricsUsed: ['news.listMostLikedNews'],
      periodAnalyzed: 'acumulado',
    };
  }

  private async buildAnomaliaInsight() {
    const days = 14;
    const counts: number[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      counts.push(await this.prisma.loginEvent.count({ where: { occurredAt: { gte: dayStart, lt: dayEnd } } }));
    }

    if (counts.every((c) => c === 0)) return null;

    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((a, b) => a + (b - mean) ** 2, 0) / counts.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev === 0) return null;

    const last = counts[counts.length - 1];
    const zScore = (last - mean) / stdDev;

    if (Math.abs(zScore) < 2) return null;

    return {
      type: 'anomalia' as const,
      text: `O volume de acessos de hoje (${last}) está ${zScore > 0 ? 'muito acima' : 'muito abaixo'} da média dos últimos ${days} dias (${mean.toFixed(1)}), desvio de ${zScore.toFixed(1)} sigma.`,
      relatedDashboard: 'access',
      metricsUsed: ['audit.loginsByDate'],
      periodAnalyzed: `últimos ${days} dias`,
    };
  }

  // ---- respostas para ask() ----

  private async answerAudience() {
    const total = await this.prisma.user.count({ where: { active: true } });
    return {
      answer: `Há ${total} colaboradores ativos cadastrados no diretório atualmente.`,
      periodAnalyzed: 'atual',
      metricsUsed: ['insights.audience.activeUsers'],
      relatedDashboardHref: '/audience',
      relatedDashboardLabel: 'Audiência',
    };
  }

  private async answerAccess() {
    const insight = await this.buildComparativoInsight();
    if (!insight) return null;
    return {
      answer: insight.text,
      periodAnalyzed: insight.periodAnalyzed,
      metricsUsed: insight.metricsUsed,
      relatedDashboardHref: '/access',
      relatedDashboardLabel: 'Acessos',
    };
  }

  private async answerContentRanking() {
    const insight = await this.buildRankingInsight();
    if (!insight) return null;
    return {
      answer: insight.text,
      periodAnalyzed: insight.periodAnalyzed,
      metricsUsed: insight.metricsUsed,
      relatedDashboardHref: '/content',
      relatedDashboardLabel: 'Conteúdo',
    };
  }

  private async answerAnomaly() {
    const insight = await this.buildAnomaliaInsight();
    if (!insight) {
      return {
        answer: 'Nenhuma anomalia relevante (desvio maior que 2 sigma) foi detectada nos acessos dos últimos 14 dias.',
        periodAnalyzed: 'últimos 14 dias',
        metricsUsed: ['audit.loginsByDate'],
        relatedDashboardHref: '/access',
        relatedDashboardLabel: 'Acessos',
      };
    }
    return {
      answer: insight.text,
      periodAnalyzed: insight.periodAnalyzed,
      metricsUsed: insight.metricsUsed,
      relatedDashboardHref: '/access',
      relatedDashboardLabel: 'Acessos',
    };
  }
}
