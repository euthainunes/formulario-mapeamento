import { appConfig } from "@/lib/app-config";
import { IRecognitionRepository, RecognitionData } from "@/services/contracts/recognition.contract";
import { MockRecognitionRepository } from "@/services/mock/recognition.mock";
import { apiFetch, toQueryString } from "@/lib/client/api-fetch";

class ApiRecognitionRepository implements IRecognitionRepository {
  async getRecognitionData(month: number, year: number): Promise<RecognitionData> {
    return apiFetch<RecognitionData>(`/api/recognition${toQueryString({ month, year })}`);
  }
}

export function getRecognitionRepository(): IRecognitionRepository {
  return appConfig.dataSource === "mock" ? new MockRecognitionRepository() : new ApiRecognitionRepository();
}
