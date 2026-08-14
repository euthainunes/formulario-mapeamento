import { initialsFromName } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";

/** Avatares com iniciais para responsáveis de uma tarefa — 0, 1 ou mais pessoas. */
export function AvatarGroup({ names, max = 3 }: { names: string[]; max?: number }) {
  if (names.length === 0) {
    return <span className="text-xs text-text-secondary italic">Sem responsável</span>;
  }
  const visible = names.slice(0, max);
  const rest = names.length - visible.length;
  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((name) => (
        <Tooltip key={name} content={name}>
          <span className="h-6 w-6 rounded-full bg-brand-secondary/20 text-brand-primary flex items-center justify-center text-[10px] font-semibold ring-2 ring-surface">
            {initialsFromName(name)}
          </span>
        </Tooltip>
      ))}
      {rest > 0 && (
        <span className="h-6 w-6 rounded-full bg-black/10 text-text-secondary flex items-center justify-center text-[10px] font-semibold ring-2 ring-surface">
          +{rest}
        </span>
      )}
    </div>
  );
}
