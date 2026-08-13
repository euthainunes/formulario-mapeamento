import { create } from "zustand";
import { GlobalFilters, PeriodPreset } from "@/types/filters";
import { rangeForPreset } from "@/lib/date-range";

interface FiltersState extends GlobalFilters {
  setPeriod: (preset: PeriodPreset) => void;
  setCompany: (value: string | null) => void;
  setDepartment: (value: string | null) => void;
  setJobTitle: (value: string | null) => void;
  setTeam: (value: string | null) => void;
  reset: () => void;
}

const defaultPeriod: PeriodPreset = "30d";

export const useFiltersStore = create<FiltersState>()((set) => ({
  period: defaultPeriod,
  dateRange: rangeForPreset(defaultPeriod),
  company: null,
  department: null,
  jobTitle: null,
  team: null,
  setPeriod: (preset) => set({ period: preset, dateRange: rangeForPreset(preset) }),
  setCompany: (value) => set({ company: value }),
  setDepartment: (value) => set({ department: value }),
  setJobTitle: (value) => set({ jobTitle: value }),
  setTeam: (value) => set({ team: value }),
  reset: () =>
    set({
      period: defaultPeriod,
      dateRange: rangeForPreset(defaultPeriod),
      company: null,
      department: null,
      jobTitle: null,
      team: null,
    }),
}));
