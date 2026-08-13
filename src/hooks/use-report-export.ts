"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getReportsRepository } from "@/services/repositories/reports.repository";
import { ReportRequest } from "@/types/report";

export function useReportHistory() {
  const query = useQuery({
    queryKey: ["reports-history"],
    queryFn: () => getReportsRepository().listHistory(),
    refetchInterval: (q) => {
      const data = q.state.data;
      const hasProcessing = data?.some((r) => r.status === "processando");
      return hasProcessing ? 2000 : false;
    },
  });
  return query;
}

export function useGenerateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ request, createdBy }: { request: ReportRequest; createdBy: string }) =>
      getReportsRepository().generateReport(request, createdBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports-history"] });
    },
  });
}
