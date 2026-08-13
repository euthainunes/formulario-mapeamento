import { appConfig } from "@/lib/app-config";
import { IDashboardRepository } from "@/services/contracts/dashboard.contract";
import { MockDashboardRepository } from "@/services/mock/dashboard.mock";
import { GlobalFilters } from "@/types/filters";
import { ExecutiveDashboardData } from "@/types/dashboard";

/**
 * Implementação futura: chamada ao backend do próprio SaaS (nunca diretamente à BeeHome
 * a partir do navegador). Hoje é apenas um stub para deixar o ponto de extensão explícito.
 */
class ApiDashboardRepository implements IDashboardRepository {
  async getExecutiveDashboard(_filters: GlobalFilters): Promise<ExecutiveDashboardData> {
    throw new Error("ApiDashboardRepository não implementado — integração real ainda não disponível.");
  }
}

export function getDashboardRepository(): IDashboardRepository {
  return appConfig.dataSource === "mock" ? new MockDashboardRepository() : new ApiDashboardRepository();
}
