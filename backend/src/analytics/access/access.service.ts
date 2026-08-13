import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GlobalFiltersDto, defaultDateRange } from '../../common/dto/global-filters.dto';
import { resolvePeriod } from '../../common/period/period.util';
import { calculateVariation } from '../../common/metrics/variation.util';
import { buildKpi } from '../../common/metrics/kpi.dto';
import { averageByHour, averageByWeekday, loginsTimeSeries, totalLoginCount } from '../query.helpers';

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getAccessData(filters: GlobalFiltersDto) {
    const { from, to } = defaultDateRange(filters);
    const period = resolvePeriod(from, to);

    const [currentTotal, previousTotal, loginsByDate, hourAvg, weekdayAvg] = await Promise.all([
      totalLoginCount(this.prisma, period.from, period.to),
      totalLoginCount(this.prisma, period.previousFrom, period.previousTo),
      loginsTimeSeries(this.prisma, period.from, period.to),
      averageByHour(this.prisma, period.from, period.to),
      averageByWeekday(this.prisma, period.from, period.to),
    ]);

    const variation = calculateVariation(currentTotal, previousTotal);

    const heatmap = hourAvg.flatMap((h) =>
      weekdayAvg.map((w, weekdayIdx) => ({
        weekday: weekdayIdx,
        hour: h.hour,
        // Aproximação: sem cruzar hora x dia-da-semana diretamente (exigiria
        // outra consulta agregada); usamos a média geral da hora como proxy.
        value: h.average,
      })),
    );

    return {
      kpis: [
        buildKpi({
          id: 'access-total-logins',
          label: 'Total de Acessos',
          value: currentTotal,
          variation,
          formula: 'Contagem de LoginEvent no período (BeeHome audit/loginsByDate)',
          version: 1,
          source: 'BeeHome audit/loginsByDate',
          unit: 'number',
        }),
      ],
      loginsByDate,
      averageByHour: hourAvg,
      averageByWeekday: weekdayAvg,
      heatmap,
      loginTable: loginsByDate.map((p) => ({ date: p.date, total: p.value })),
      partialCoverage: currentTotal === 0,
    };
  }
}
