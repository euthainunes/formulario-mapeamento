import { Pod } from "@/types/content";
import { seededRandom } from "@/lib/utils";

const POD_NAMES = [
  { name: "Pod Comunicação", description: "Espaço colaborativo do time de Comunicação Interna." },
  { name: "Pod Tecnologia", description: "Discussões técnicas e novidades de produto." },
  { name: "Pod Vendas", description: "Estratégias comerciais e cases de sucesso." },
  { name: "Pod RH & Cultura", description: "Cultura organizacional, benefícios e clima." },
  { name: "Pod Inovação", description: "Ideias, hackathons e experimentação." },
  { name: "Pod Sustentabilidade", description: "Ações e iniciativas ESG da empresa." },
  { name: "Pod Liderança", description: "Conteúdos voltados a gestores e liderados." },
  { name: "Pod Onboarding", description: "Apoio à jornada de novos colaboradores." },
  { name: "Pod Financeiro", description: "Boas práticas e novidades financeiras." },
  { name: "Pod Diversidade", description: "Ações e grupos de afinidade da empresa." },
];

function buildPods(): Pod[] {
  const rnd = seededRandom(64);
  return POD_NAMES.map((p, idx) => {
    const accessCount = 300 + Math.floor(rnd() * 4200);
    const statusRoll = rnd();
    const status = statusRoll > 0.6 ? "crescimento" : statusRoll > 0.3 ? "estavel" : "queda";
    return {
      id: `pod-${idx + 1}`,
      name: p.name,
      description: p.description,
      accessCount,
      participationPercent: 0, // preenchido depois com base no total
      status,
    } satisfies Pod;
  });
}

const podsRaw = buildPods();
const totalAccess = podsRaw.reduce((acc, p) => acc + p.accessCount, 0);

export const MOCK_PODS: Pod[] = podsRaw.map((p) => ({
  ...p,
  participationPercent: Number(((p.accessCount / totalAccess) * 100).toFixed(1)),
}));
