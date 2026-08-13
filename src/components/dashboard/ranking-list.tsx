import { RankingItem } from "@/types/metrics";
import { formatNumber } from "@/lib/formatters";

interface RankingListProps {
  items: RankingItem[];
  emptyMessage?: string;
}

export function RankingList({ items, emptyMessage = "Sem dados no período selecionado." }: RankingListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-text-secondary py-4 text-center">{emptyMessage}</p>;
  }

  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <ol className="space-y-2.5">
      {items.map((item, idx) => (
        <li key={item.id} className="flex items-center gap-3">
          <span className="w-5 shrink-0 text-xs font-semibold text-text-secondary">{idx + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-sm text-text-primary truncate">{item.name}</p>
              <p className="text-xs font-medium text-text-secondary shrink-0">{formatNumber(item.value)}</p>
            </div>
            <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-primary"
                style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
