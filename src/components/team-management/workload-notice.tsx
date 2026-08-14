import { ShieldAlert } from "lucide-react";
import { WORKLOAD_POLICY_NOTICE } from "@/lib/team-metrics";

export function WorkloadNotice() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-warning/25 bg-warning/5 p-3.5 text-xs text-text-secondary mb-4">
      <ShieldAlert className="h-4 w-4 text-warning shrink-0 mt-0.5" />
      <p>{WORKLOAD_POLICY_NOTICE}</p>
    </div>
  );
}
