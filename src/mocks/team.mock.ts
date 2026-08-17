import { Collaborator } from "@/types/user";
import { initialsFromName } from "@/lib/utils";
import { isoDate, REFERENCE_TODAY } from "@/lib/date-range";
import { subDays } from "date-fns";

/**
 * Time de Comunicação — colaboradoras cujos indicadores (audiência, conteúdo,
 * Beezz, engajamento) a Bruna acompanha e analisa como administradora.
 *
 * IMPORTANTE: estas pessoas NÃO são contas do sistema (não fazem login, não
 * têm perfil de acesso). Elas existem apenas como dados rastreados — a
 * mesma forma como qualquer colaborador apareceria vindo da BeeHome. A única
 * conta administradora do SaaS é a Bruna (ver src/mocks/users.mock.ts).
 */
function member(
  name: string,
  jobTitle: string,
  daysSinceAdmission: number,
  birthMonth: number,
  birthDay: number
): Collaborator {
  return {
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    avatarInitials: initialsFromName(name),
    company: "BeeHome Matriz",
    department: "Comunicação",
    jobTitle,
    group: "Comunicação Interna",
    team: "Time Conteúdo",
    device: "desktop",
    lastActivity: isoDate(subDays(REFERENCE_TODAY, 0)),
    admissionDate: isoDate(subDays(REFERENCE_TODAY, daysSinceAdmission)),
    birthDate: isoDate(new Date(1992, birthMonth, birthDay)),
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@beehome-demo.com`,
    skills: ["Comunicação Interna", "Redes Sociais"],
    active: true,
  };
}

export const COMMUNICATION_TEAM: Collaborator[] = [
  member("Thaina Nunes", "Analista de Comunicação", 620, 2, 14),
  member("Mariana da Silva", "Coordenadora de Comunicação", 1450, 6, 3),
  member("Hector Kodi", "Especialista de Conteúdo", 980, 9, 22),
  member("Camila Pessoa", "Analista de Comunicação", 340, 0, 30),
  member("Caroline Verdinassi", "Analista de Comunicação", 210, 4, 11),
  member("Larissa Nascimento", "Analista de Comunicação", 75, 11, 5),
  member("Sarah dos Santos", "Analista de Comunicação", 500, 7, 19),
  member("Letícia Vieira", "Analista de Comunicação", 150, 3, 8),
];
