import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GlobalFiltersDto, defaultDateRange } from '../../common/dto/global-filters.dto';
import { resolvePeriod } from '../../common/period/period.util';
import { calculateVariation } from '../../common/metrics/variation.util';
import { buildKpi } from '../../common/metrics/kpi.dto';

@Injectable()
export class PodsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPodsData(filters: GlobalFiltersDto) {
    const { from, to } = defaultDateRange(filters);
    const period = resolvePeriod(from, to);

    const [pods, snapshotsCurrent, snapshotsPrevious] = await Promise.all([
      this.prisma.pod.findMany({ orderBy: { accessCount: 'desc' } }),
      this.prisma.metricSnapshot.findMany({ where: { metricCode: 'pods.total', periodStart: { gte: period.from }, periodEnd: { lte: period.to } } }),
      this.prisma.metricSnapshot.findMany({ where: { metricCode: 'pods.total', periodStart: { gte: period.previousFrom }, periodEnd: { lte: period.previousTo } } }),
    ]);

    const totalAccess = pods.reduce((s, p) => s + p.accessCount, 0);
    const previousTotal = snapshotsPrevious.reduce((s, m) => s + Number(m.value), 0);
    const variation = calculateVariation(totalAccess, previousTotal);

    const avgAccess = pods.length ? totalAccess / pods.length : 0;

    const podsDto = pods.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? '',
      accessCount: p.accessCount,
      participationPercent: totalAccess ? (p.accessCount / totalAccess) * 100 : 0,
      status: (p.accessCount > avgAccess * 1.1 ? 'crescimento' : p.accessCount < avgAccess * 0.9 ? 'queda' : 'estavel') as 'crescimento' | 'queda' | 'estavel',
    }));

    const evolution = snapshotsCurrent
      .sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime())
      .map((m) => ({ date: m.periodStart.toISOString().slice(0, 10), value: Number(m.value) }));

    return {
      kpis: [
        buildKpi({
          id: 'pods-total-access',
          label: 'Acessos a Pods',
          value: totalAccess,
          variation,
          formula: 'Soma de Pod.accessCount (BeeHome pod/audit/list/mostAccessed + leastAccessed)',
          version: 1,
          source: 'BeeHome pod/audit/list/*',
          unit: 'number',
        }),
      ],
      pods: podsDto,
      evolution,
      partialCoverage: pods.length === 0,
    };
  }
}
