import { TeamBucket, TeamPlan, TEAM_BUCKET_NAMES } from "@/types/team-management";

export const TEAM_PLAN: TeamPlan = {
  id: "plan-comunicacao-interna",
  title: "Planner — Comunicação Interna",
  ownerName: "Mariana Souza",
};

export const TEAM_BUCKETS: TeamBucket[] = TEAM_BUCKET_NAMES.map((name, index) => ({
  id: `bucket-${index + 1}`,
  planId: TEAM_PLAN.id,
  name,
  orderHint: index + 1,
}));

export const BUCKET_ID = {
  backlog: TEAM_BUCKETS[0].id,
  briefing: TEAM_BUCKETS[1].id,
  planejamento: TEAM_BUCKETS[2].id,
  producao: TEAM_BUCKETS[3].id,
  aprovacao: TEAM_BUCKETS[4].id,
  agendamento: TEAM_BUCKETS[5].id,
  concluido: TEAM_BUCKETS[6].id,
} as const;
