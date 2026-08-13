import { COMPANIES, DEPARTMENTS, JOB_TITLES, TEAMS } from "@/lib/constants";
import { OrgOption } from "@/types/filters";

function toOptions(values: string[]): OrgOption[] {
  return values.map((v) => ({ value: v, label: v }));
}

export const MOCK_COMPANY_OPTIONS: OrgOption[] = toOptions(COMPANIES);
export const MOCK_DEPARTMENT_OPTIONS: OrgOption[] = toOptions(DEPARTMENTS);
export const MOCK_JOB_TITLE_OPTIONS: OrgOption[] = toOptions(JOB_TITLES);
export const MOCK_TEAM_OPTIONS: OrgOption[] = toOptions(TEAMS);
