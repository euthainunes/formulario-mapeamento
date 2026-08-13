import { GlobalFilters } from "@/types/filters";
import { ExecutiveDashboardData } from "@/types/dashboard";

/**
 * Contrato do domínio "Dashboard Executivo". Uma implementação futura (ApiDashboardRepository)
 * deve respeitar exatamente esta assinatura para substituir o mock sem alterar telas.
 */
export interface IDashboardRepository {
  getExecutiveDashboard(filters: GlobalFilters): Promise<ExecutiveDashboardData>;
}
