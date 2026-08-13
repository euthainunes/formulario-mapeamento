"use client";

import { useQuery } from "@tanstack/react-query";
import { getDirectoryRepository } from "@/services/repositories/directory.repository";
import { GlobalFilters } from "@/types/filters";

export function useDirectoryData(filters: GlobalFilters, search: string) {
  return useQuery({
    queryKey: ["directory", filters, search],
    queryFn: () => getDirectoryRepository().getDirectory(filters, search),
  });
}
