"use client";

import { useFiltersStore } from "@/store/filters.store";

export function useGlobalFilters() {
  return useFiltersStore();
}
