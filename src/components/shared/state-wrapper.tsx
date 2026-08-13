import { ReactNode } from "react";
import { AlertTriangle, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface StateWrapperProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  partialCoverage?: boolean;
  loadingSkeleton?: ReactNode;
  emptyMessage?: string;
  errorMessage?: string;
  children: ReactNode;
}

export function StateWrapper({
  isLoading,
  isError,
  isEmpty,
  partialCoverage,
  loadingSkeleton,
  emptyMessage = "Nenhum dado disponível para os filtros selecionados.",
  errorMessage = "Não foi possível carregar os dados neste momento.",
  children,
}: StateWrapperProps) {
  if (isLoading) {
    return (
      <>{loadingSkeleton ?? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}</>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-text-secondary">
        <AlertTriangle className="h-6 w-6 text-error" />
        <p className="text-sm">{errorMessage}</p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-text-secondary">
        <Inbox className="h-6 w-6" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {partialCoverage && (
        <div className="mb-3">
          <Badge tone="warning">Cobertura parcial dos dados neste período</Badge>
        </div>
      )}
      {children}
    </>
  );
}
