import { Collaborator, DeviceType } from "@/types/user";
import { COMPANIES, DEPARTMENTS, JOB_TITLES, TEAMS } from "@/lib/constants";
import { seededRandom, initialsFromName } from "@/lib/utils";
import { subDays } from "date-fns";
import { REFERENCE_TODAY, isoDate } from "@/lib/date-range";
import { COMMUNICATION_TEAM } from "./team.mock";

const FIRST_NAMES = [
  "Ana", "Bruno", "Carla", "Diego", "Elaine", "Fábio", "Gabriela", "Henrique",
  "Isabela", "João", "Karina", "Lucas", "Mariana", "Nicolas", "Olívia", "Pedro",
  "Quésia", "Rafael", "Sofia", "Tiago", "Úrsula", "Vinícius", "Wagner", "Ximena",
  "Yasmin", "Zeca", "Beatriz", "Caio", "Daniela", "Eduardo", "Fernanda", "Gustavo",
  "Helena", "Igor", "Julia", "Kaique", "Larissa", "Marcelo", "Natália", "Otávio",
  "Patrícia", "Quirino", "Renata", "Samuel", "Tatiane", "Ubiratã", "Valentina",
  "William", "Xavier", "Yago", "Zilda", "Camila", "Douglas", "Estela", "Felipe",
];
const LAST_NAMES = [
  "Silva", "Souza", "Oliveira", "Santos", "Pereira", "Costa", "Ferreira",
  "Almeida", "Ribeiro", "Carvalho", "Gomes", "Martins", "Rocha", "Araújo",
  "Barbosa", "Nascimento", "Lima", "Moreira", "Cardoso", "Teixeira", "Duarte",
  "Correia", "Machado", "Freitas", "Cavalcanti", "Dias", "Castro", "Campos",
  "Batista", "Nunes",
];
const DEVICES: DeviceType[] = ["desktop", "mobile", "tablet"];
const SKILL_POOL = [
  "Comunicação Interna", "Copywriting", "Design Gráfico", "Excel Avançado",
  "Gestão de Projetos", "Power BI", "Fotografia", "Edição de Vídeo",
  "Oratória", "Redes Sociais", "Atendimento", "Liderança", "Negociação",
  "Análise de Dados", "SQL", "Facilitação", "UX Writing", "SEO",
];

function pick<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)];
}

function buildCollaborators(count: number): Collaborator[] {
  const rnd = seededRandom(42);
  const list: Collaborator[] = [];
  const usedNames = new Set<string>();
  for (let i = 0; i < count; i++) {
    let name = `${pick(FIRST_NAMES, rnd)} ${pick(LAST_NAMES, rnd)}`;
    while (usedNames.has(name)) {
      name = `${pick(FIRST_NAMES, rnd)} ${pick(LAST_NAMES, rnd)}`;
    }
    usedNames.add(name);

    const admissionDate = isoDate(subDays(REFERENCE_TODAY, Math.floor(rnd() * 365 * 6)));
    const birthMonth = Math.floor(rnd() * 12);
    const birthDay = 1 + Math.floor(rnd() * 28);
    const birthDate = isoDate(new Date(1985 + Math.floor(rnd() * 20), birthMonth, birthDay));
    const lastActivity = isoDate(subDays(REFERENCE_TODAY, Math.floor(rnd() * 45)));

    list.push({
      id: `col-${i + 1}`,
      name,
      avatarInitials: initialsFromName(name),
      company: pick(COMPANIES, rnd),
      department: pick(DEPARTMENTS, rnd),
      jobTitle: pick(JOB_TITLES, rnd),
      group: `Grupo ${1 + Math.floor(rnd() * 5)}`,
      team: pick(TEAMS, rnd),
      device: pick(DEVICES, rnd),
      lastActivity,
      admissionDate,
      birthDate,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@beehome-demo.com`,
      skills: Array.from(
        new Set(Array.from({ length: 3 }, () => pick(SKILL_POOL, rnd)))
      ),
      active: rnd() > 0.06,
    });
  }
  return list;
}

export const MOCK_COLLABORATORS: Collaborator[] = [...COMMUNICATION_TEAM, ...buildCollaborators(173)];

export function activeAsOf(dateIso: string): Collaborator[] {
  return MOCK_COLLABORATORS.filter((c) => c.lastActivity <= dateIso);
}

export interface OrgFilterParams {
  company?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  team?: string | null;
}

export function filterCollaborators(params: OrgFilterParams): Collaborator[] {
  return MOCK_COLLABORATORS.filter((c) => {
    if (params.company && c.company !== params.company) return false;
    if (params.department && c.department !== params.department) return false;
    if (params.jobTitle && c.jobTitle !== params.jobTitle) return false;
    if (params.team && c.team !== params.team) return false;
    return true;
  });
}
