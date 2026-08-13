import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GlobalFiltersDto, defaultDateRange } from '../../common/dto/global-filters.dto';
import { resolvePeriod } from '../../common/period/period.util';
import { calculateVariation } from '../../common/metrics/variation.util';
import { buildKpi } from '../../common/metrics/kpi.dto';
import { deviceBreakdown, distinctActiveUserCount, loginsTimeSeries } from '../query.helpers';
import { toCollaboratorDto } from '../collaborator.mapper';

@Injectable()
export class AudienceService {
  constructor(private readonly prisma: PrismaService) {}

  async getAudienceData(filters: GlobalFiltersDto) {
    const { from, to } = defaultDateRange(filters);
    const period = resolvePeriod(from, to);

    const [currentActive, previousActive, activeEvolution, devices, collaborators] = await Promise.all([
      distinctActiveUserCount(this.prisma, period.from, period.to),
      distinctActiveUserCount(this.prisma, period.previousFrom, period.previousTo),
      loginsTimeSeries(this.prisma, period.from, period.to),
      deviceBreakdown(this.prisma, period.from, period.to),
      this.prisma.user.findMany({
        where: { active: true },
        include: { company: true, department: true, jobTitle: true, team: true },
        take: 100,
      }),
    ]);

    const variation = calculateVariation(currentActive, previousActive);

    const periodComparison = activeEvolution.map((point, idx) => ({
      label: point.date,
      currentPeriod: point.value,
      previousPeriod: activeEvolution[idx]?.value ?? 0, // TODO: alinhar por offset real quando houver granularidade suficiente
    }));

    return {
      kpis: [
        buildKpi({
          id: 'audience-active-users',
          label: 'Usuários Ativos',
          value: currentActive,
          variation,
          formula: 'Contagem de userSourceId distintos em LoginEvent no período (audit/loginsByDate normalizado)',
          version: 1,
          source: 'BeeHome audit/loginsByDate (normalizado)',
          unit: 'number',
        }),
      ],
      activeEvolution,
      deviceBreakdown: devices,
      periodComparison,
      collaborators: collaborators.map(toCollaboratorDto),
      partialCoverage: currentActive === 0 && previousActive === 0,
    };
  }
}
