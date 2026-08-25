import { callBeeHome, BeeHomeApiError } from "@/lib/server/beehome-client";
import { toNumber, asList, kpisFromPeopleToday, toContentItem, toBeezzPost, deviceBreakdownFrom } from "@/lib/server/beehome-mappers";
import { DateRange } from "@/lib/server/beehome-mappers";
import { ContentItem, BeezzPost } from "@/types/content";

/**
 * Monta o "boletim de fatos" que alimenta a IA de Insights — não é o JSON
 * cru da BeeHome, é o resultado JÁ calculado e validado pelos mesmos
 * mapeadores usados no Dashboard/Conteúdos/Beezz/Pods (ver beehome-mappers.ts).
 * A IA nunca vê dado não verificado; ela só narra/cruza números que o
 * próprio código já calculou de forma determinística.
 *
 * Cada seção que depender de uma chamada que falhar fica `null` com uma nota
 * explícita — isso é o que permite a IA responder "dados insuficientes" em
 * vez de inventar, sem precisar adivinhar se um campo ausente é zero real ou
 * falha de rede.
 */

export interface InsightsFactsheet {
  period: DateRange;
  audience: {
    activeUsers: number;
    activeUsersWithLogin: number;
    monthlyActiveUsers: number;
    engagedUsers: number;
  } | null;
  devices: { device: string; count: number; percent: number }[] | null;
  topNews: { title: string; views: number; likes: number; comments: number }[] | null;
  topBeezz: { title: string; likes: number }[] | null;
  topPodsAccessed: { name: string; accessCount: number }[] | null;
  bottomPodsAccessed: { name: string; accessCount: number }[] | null;
  unavailable: string[];
}

export async function gatherInsightsFactsheet(range: DateRange): Promise<InsightsFactsheet> {
  const results = await Promise.allSettled([
    callBeeHome("peopleToday", {}),
    callBeeHome("device", { startDate: range.from, endDate: range.to }),
    callBeeHome("newsListMostViewedNews", { startDate: range.from, endDate: range.to }),
    callBeeHome("beedataBeezzLikeTop", { pageNumber: 1, pageSize: 5 }),
    callBeeHome("podAuditListMostAccessed", { startDate: range.from, endDate: range.to }),
    callBeeHome("podAuditListLeastAccessed", { startDate: range.from, endDate: range.to }),
  ]);
  const [peopleToday, device, topNewsRaw, topBeezzRaw, topPods, bottomPods] = results;

  const unavailable: string[] = [];
  const label = (name: string, r: PromiseSettledResult<unknown>) => {
    if (r.status === "rejected") {
      const reason = r.reason;
      unavailable.push(`${name}: ${reason instanceof BeeHomeApiError ? `HTTP ${reason.status ?? "?"}` : "falha ao conectar"}`);
    }
  };
  label("audience", peopleToday);
  label("devices", device);
  label("topNews", topNewsRaw);
  label("topBeezz", topBeezzRaw);
  label("topPodsAccessed", topPods);
  label("bottomPodsAccessed", bottomPods);

  const audience =
    peopleToday.status === "fulfilled"
      ? (() => {
          const kpis = kpisFromPeopleToday(peopleToday.value as Record<string, unknown>);
          return {
            activeUsers: kpis.find((k) => k.id === "active-users")?.value ?? 0,
            activeUsersWithLogin: kpis.find((k) => k.id === "active-users-login")?.value ?? 0,
            monthlyActiveUsers: kpis.find((k) => k.id === "monthly-active-users")?.value ?? 0,
            engagedUsers: kpis.find((k) => k.id === "engaged-users")?.value ?? 0,
          };
        })()
      : null;

  const devices = device.status === "fulfilled" ? deviceBreakdownFrom(asList(device.value)) : null;

  const topNews =
    topNewsRaw.status === "fulfilled"
      ? asList(topNewsRaw.value)
          .map(toContentItem)
          .filter((i): i is ContentItem => i !== null)
          .slice(0, 5)
          .map((i) => ({ title: i.title, views: i.views, likes: i.likes, comments: i.comments }))
      : null;

  const topBeezz =
    topBeezzRaw.status === "fulfilled"
      ? asList(topBeezzRaw.value)
          .map(toBeezzPost)
          .filter((p): p is BeezzPost => p !== null)
          .slice(0, 5)
          .map((p) => ({ title: p.title, likes: p.likes }))
      : null;

  function podList(result: PromiseSettledResult<unknown>): { name: string; accessCount: number }[] | null {
    if (result.status !== "fulfilled") return null;
    return asList(result.value)
      .map((row) => ({ name: String(row.title ?? row.name ?? ""), accessCount: toNumber(row.count ?? row.accessCount) }))
      .filter((p) => p.name)
      .slice(0, 5);
  }

  return {
    period: range,
    audience,
    devices,
    topNews,
    topBeezz,
    topPodsAccessed: podList(topPods),
    bottomPodsAccessed: podList(bottomPods),
    unavailable,
  };
}
