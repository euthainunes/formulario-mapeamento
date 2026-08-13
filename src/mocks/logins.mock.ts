import { getDay } from "date-fns";
import { REFERENCE_TODAY, isoDate } from "@/lib/date-range";
import { seededRandom } from "@/lib/utils";
import { MOCK_COLLABORATORS } from "./audience.mock";

export interface LoginRecord {
  date: string; // yyyy-MM-dd
  hour: number; // 0-23
  collaboratorId: string;
}

export interface DailyLoginTotal {
  date: string;
  total: number;
}

const DAYS = 90;

function buildLogins(): LoginRecord[] {
  const rnd = seededRandom(7);
  const records: LoginRecord[] = [];
  for (let d = DAYS - 1; d >= 0; d--) {
    const date = new Date(REFERENCE_TODAY);
    date.setDate(date.getDate() - d);
    const dow = getDay(date); // 0 = domingo
    const isWeekend = dow === 0 || dow === 6;
    const baseVolume = isWeekend ? 25 : 140;
    const volume = Math.round(baseVolume * (0.75 + rnd() * 0.5));
    for (let i = 0; i < volume; i++) {
      // horário de pico simulado: 9h-11h e 14h-16h
      const hourBucket = rnd();
      let hour: number;
      if (hourBucket < 0.4) hour = 9 + Math.floor(rnd() * 3);
      else if (hourBucket < 0.7) hour = 14 + Math.floor(rnd() * 3);
      else hour = Math.floor(rnd() * 24);
      const collaborator = MOCK_COLLABORATORS[Math.floor(rnd() * MOCK_COLLABORATORS.length)];
      records.push({ date: isoDate(date), hour, collaboratorId: collaborator.id });
    }
  }
  return records;
}

export const MOCK_LOGINS: LoginRecord[] = buildLogins();

export function loginsInRange(fromIso: string, toIso: string): LoginRecord[] {
  return MOCK_LOGINS.filter((l) => l.date >= fromIso && l.date <= toIso);
}

export function dailyTotals(records: LoginRecord[]): DailyLoginTotal[] {
  const map = new Map<string, number>();
  for (const r of records) map.set(r.date, (map.get(r.date) ?? 0) + 1);
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, total]) => ({ date, total }));
}
