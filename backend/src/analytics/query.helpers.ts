import { PrismaService } from '../prisma/prisma.service';

export interface TimeSeriesPointDto {
  date: string;
  value: number;
}

/** Série temporal de logins por dia, no intervalo [from, to]. */
export async function loginsTimeSeries(prisma: PrismaService, from: Date, to: Date): Promise<TimeSeriesPointDto[]> {
  const events = await prisma.loginEvent.findMany({
    where: { occurredAt: { gte: from, lte: to } },
    select: { occurredAt: true },
  });

  const byDay = new Map<string, number>();
  for (const e of events) {
    const key = e.occurredAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}

export async function distinctActiveUserCount(prisma: PrismaService, from: Date, to: Date): Promise<number> {
  const events = await prisma.loginEvent.findMany({
    where: { occurredAt: { gte: from, lte: to }, userSourceId: { not: null } },
    select: { userSourceId: true },
    distinct: ['userSourceId'],
  });
  return events.length;
}

export async function totalLoginCount(prisma: PrismaService, from: Date, to: Date): Promise<number> {
  return prisma.loginEvent.count({ where: { occurredAt: { gte: from, lte: to } } });
}

export interface DeviceBreakdownDto {
  device: string;
  count: number;
  percent: number;
}

export async function deviceBreakdown(prisma: PrismaService, from: Date, to: Date): Promise<DeviceBreakdownDto[]> {
  const events = await prisma.loginEvent.findMany({
    where: { occurredAt: { gte: from, lte: to } },
    include: { device: true },
  });

  const byType = new Map<string, number>();
  for (const e of events) {
    const type = e.device?.type ?? 'desconhecido';
    byType.set(type, (byType.get(type) ?? 0) + 1);
  }

  const total = events.length || 1;
  return Array.from(byType.entries()).map(([device, count]) => ({
    device,
    count,
    percent: (count / total) * 100,
  }));
}

export interface HourAverageDto {
  hour: number;
  average: number;
}

export async function averageByHour(prisma: PrismaService, from: Date, to: Date): Promise<HourAverageDto[]> {
  const events = await prisma.loginEvent.findMany({ where: { occurredAt: { gte: from, lte: to } }, select: { occurredAt: true } });
  const days = new Set(events.map((e) => e.occurredAt.toISOString().slice(0, 10))).size || 1;

  const counts = new Array(24).fill(0);
  for (const e of events) counts[e.occurredAt.getUTCHours()]++;

  return counts.map((count, hour) => ({ hour, average: count / days }));
}

export interface WeekdayAverageDto {
  weekday: string;
  average: number;
}

const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export async function averageByWeekday(prisma: PrismaService, from: Date, to: Date): Promise<WeekdayAverageDto[]> {
  const events = await prisma.loginEvent.findMany({ where: { occurredAt: { gte: from, lte: to } }, select: { occurredAt: true } });
  const weeks = new Set(events.map((e) => isoWeekKey(e.occurredAt))).size || 1;

  const counts = new Array(7).fill(0);
  for (const e of events) counts[e.occurredAt.getUTCDay()]++;

  return counts.map((count, idx) => ({ weekday: WEEKDAY_LABELS[idx], average: count / weeks }));
}

function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
}
