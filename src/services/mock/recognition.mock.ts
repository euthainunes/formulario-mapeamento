import { IRecognitionRepository, RecognitionData } from "@/services/contracts/recognition.contract";
import { delay, chance } from "./_shared";
import { MOCK_COLLABORATORS } from "@/mocks/audience.mock";
import { REFERENCE_TODAY } from "@/lib/date-range";
import { KpiCard } from "@/types/metrics";

export class MockRecognitionRepository implements IRecognitionRepository {
  async getRecognitionData(month: number): Promise<RecognitionData> {
    const people = MOCK_COLLABORATORS;
    const birthdays = people.filter((p) => new Date(p.birthDate).getMonth() + 1 === month);

    const now = REFERENCE_TODAY.getTime();
    const totalMonths = people.reduce((acc, p) => {
      const admission = new Date(p.admissionDate).getTime();
      const months = (now - admission) / (1000 * 60 * 60 * 24 * 30.44);
      return acc + months;
    }, 0);
    const avgMonths = people.length ? totalMonths / people.length : 0;

    const kpis: KpiCard[] = [
      {
        id: "birthdays",
        label: "Aniversariantes do mês",
        value: birthdays.length,
        variation: { current: birthdays.length, previous: birthdays.length, comparable: false, percentChange: null, direction: "none" },
      },
      {
        id: "avg-tenure",
        label: "Tempo médio de empresa (meses)",
        value: Math.round(avgMonths),
        variation: { current: avgMonths, previous: avgMonths, comparable: false, percentChange: null, direction: "none" },
        formula: "soma do tempo de empresa (em meses) de todos os colaboradores ÷ número de colaboradores",
        partialCoverage: true,
      },
    ];

    return delay({ kpis, birthdaysThisMonth: birthdays, allPeople: people, partialCoverage: chance(0.05) });
  }
}
