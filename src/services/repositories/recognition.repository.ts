import { appConfig } from "@/lib/app-config";
import { IRecognitionRepository, RecognitionData } from "@/services/contracts/recognition.contract";
import { MockRecognitionRepository } from "@/services/mock/recognition.mock";

class ApiRecognitionRepository implements IRecognitionRepository {
  async getRecognitionData(_month: number, _year: number): Promise<RecognitionData> {
    throw new Error("ApiRecognitionRepository não implementado — integração real ainda não disponível.");
  }
}

export function getRecognitionRepository(): IRecognitionRepository {
  return appConfig.dataSource === "mock" ? new MockRecognitionRepository() : new ApiRecognitionRepository();
}
