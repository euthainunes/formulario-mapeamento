import { REACTION_TYPES, REACTION_LABELS, ReactionTotal, ReactionType } from "@/types/content";
import { seededRandom } from "@/lib/utils";
import { isoDate, REFERENCE_TODAY } from "@/lib/date-range";

export interface ReactionDailyRecord {
  date: string;
  type: ReactionType;
  count: number;
}

const BASE_VOLUME: Record<ReactionType, number> = {
  countBeezzLiked: 55,
  countCommentsBeezz: 18,
  countBeezzCommentLike: 12,
  countNewsLiked: 40,
  countCommentsNews: 15,
  countNewsCommentLike: 9,
  countVideoLiked: 22,
  countCommentsVideos: 8,
  countPollLiked: 14,
  countPhotobookLiked: 19,
  countBlogLiked: 11,
  countPodcastLiked: 7,
};

function buildDaily(): ReactionDailyRecord[] {
  const rnd = seededRandom(51);
  const records: ReactionDailyRecord[] = [];
  for (let d = 89; d >= 0; d--) {
    const date = new Date(REFERENCE_TODAY);
    date.setDate(date.getDate() - d);
    for (const type of REACTION_TYPES) {
      const base = BASE_VOLUME[type];
      const count = Math.max(0, Math.round(base * (0.5 + rnd())));
      records.push({ date: isoDate(date), type, count });
    }
  }
  return records;
}

export const MOCK_REACTIONS_DAILY: ReactionDailyRecord[] = buildDaily();

export function reactionTotalsInRange(fromIso: string, toIso: string): ReactionTotal[] {
  const totals = new Map<ReactionType, number>();
  for (const type of REACTION_TYPES) totals.set(type, 0);
  for (const r of MOCK_REACTIONS_DAILY) {
    if (r.date >= fromIso && r.date <= toIso) {
      totals.set(r.type, (totals.get(r.type) ?? 0) + r.count);
    }
  }
  return REACTION_TYPES.map((type) => ({
    type,
    label: REACTION_LABELS[type],
    count: totals.get(type) ?? 0,
  }));
}
