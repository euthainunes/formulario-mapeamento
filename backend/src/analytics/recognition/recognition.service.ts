import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildKpi } from '../../common/metrics/kpi.dto';
import { calculateVariation } from '../../common/metrics/variation.util';
import { toCollaboratorDto } from '../collaborator.mapper';

@Injectable()
export class RecognitionService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecognitionData(month: number, year: number) {
    const [allUsers, admissionAwardsThisMonth, admissionAwardsLastMonth] = await Promise.all([
      this.prisma.user.findMany({ where: { active: true }, include: { company: true, department: true, jobTitle: true, team: true }, take: 200 }),
      this.prisma.admissionAward.count({ where: { month, year } }),
      this.prisma.admissionAward.count({ where: { month: month === 1 ? 12 : month - 1, year: month === 1 ? year - 1 : year } }),
    ]);

    const collaborators = allUsers.map(toCollaboratorDto);

    // birthDate só está disponível se vier em metadataJson (ver aviso em
    // collaborator.mapper.ts) — não há endpoint de Directory/perfis
    // documentado para obter data de nascimento de forma confiável.
    const birthdaysThisMonth = collaborators.filter((c) => {
      if (!c.birthDate) return false;
      const d = new Date(c.birthDate);
      return !Number.isNaN(d.getTime()) && d.getUTCMonth() + 1 === month;
    });

    const variation = calculateVariation(admissionAwardsThisMonth, admissionAwardsLastMonth);

    return {
      kpis: [
        buildKpi({
          id: 'recognition-admission-awards',
          label: 'Premiações de Admissão no Mês',
          value: admissionAwardsThisMonth,
          variation,
          formula: 'Contagem de AdmissionAward para o mês/ano informado',
          version: 1,
          source: 'BeeHome api/award/list/admissionAwardByMonth',
          unit: 'number',
        }),
      ],
      birthdaysThisMonth,
      allPeople: collaborators,
      partialCoverage: true, // cobertura parcial: skills/birthDate dependem de dado ainda não sincronizado
    };
  }
}
