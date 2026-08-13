import { Collaborator } from "@/types/user";
import { KpiCard } from "@/types/metrics";

export interface RecognitionData {
  kpis: KpiCard[];
  birthdaysThisMonth: Collaborator[];
  allPeople: Collaborator[];
  partialCoverage?: boolean;
}

export interface IRecognitionRepository {
  getRecognitionData(month: number, year: number): Promise<RecognitionData>;
}
