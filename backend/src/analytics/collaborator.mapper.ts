/**
 * Mapeia um User (+ relações) para o formato `Collaborator` esperado pelo
 * front-end (src/types/user.ts). Campos que a BeeHome não documenta
 * (skills, admissionDate, birthDate, group) NÃO são inventados — vêm de
 * `metadataJson` quando presentes (preenchidos por uma sincronização
 * futura, quando o endpoint de Directory for validado) ou retornam
 * vazio/null. Ver aviso na spec: "Não existem endpoints documentados para
 * Directory/perfis, exportação de usuários ou skills".
 */
export function toCollaboratorDto(user: {
  id: string;
  name: string;
  email: string;
  active: boolean;
  avatarInitials?: string | null;
  lastLoginAt?: Date | null;
  company?: { name: string } | null;
  department?: { name: string } | null;
  jobTitle?: { name: string } | null;
  team?: { name: string } | null;
  metadataJson?: unknown;
}) {
  const meta = (user.metadataJson ?? {}) as Record<string, unknown>;

  return {
    id: user.id,
    name: user.name,
    avatarInitials: user.avatarInitials ?? initialsFromName(user.name),
    company: user.company?.name ?? '',
    department: user.department?.name ?? '',
    jobTitle: user.jobTitle?.name ?? '',
    group: (meta.group as string) ?? user.department?.name ?? '',
    team: user.team?.name ?? '',
    device: (meta.device as string) ?? 'desktop',
    lastActivity: user.lastLoginAt?.toISOString() ?? '',
    // TODO: preencher a partir de um endpoint de Directory real quando validado com a BeeHome.
    admissionDate: (meta.admissionDate as string) ?? '',
    birthDate: (meta.birthDate as string) ?? '',
    email: user.email,
    skills: (meta.skills as string[]) ?? [],
    active: user.active,
  };
}

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
