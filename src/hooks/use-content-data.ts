"use client";

import { useQuery } from "@tanstack/react-query";
import { getContentRepository } from "@/services/repositories/content.repository";
import { GlobalFilters } from "@/types/filters";

export function useContentData(filters: GlobalFilters) {
  return useQuery({
    queryKey: ["content", filters],
    queryFn: () => getContentRepository().getContentData(filters),
  });
}
