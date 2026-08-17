import { AuthUser } from "@/types/auth";
import { initialsFromName } from "@/lib/utils";

interface MockAccount extends AuthUser {
  loginHint: string;
}

function build(
  name: string,
  role: AuthUser["role"],
  department: string,
  jobTitle: string
): MockAccount {
  const id = name.toLowerCase().replace(/\s+/g, "-");
  return {
    id,
    name,
    email: `${id}@beehome-demo.com`,
    role,
    department,
    jobTitle,
    avatarInitials: initialsFromName(name),
    loginHint: "Entrar como (modo demonstração — sem senha)",
  };
}

/**
 * Bruna é a ÚNICA conta de login do SaaS — administradora da plataforma.
 * As demais colaboradoras da Comunicação (ver src/mocks/team.mock.ts) não
 * são usuárias do sistema: são pessoas cujos indicadores (audiência,
 * conteúdo, Beezz, engajamento) a Bruna acompanha e analisa através dele.
 */
export const MOCK_ACCOUNTS: MockAccount[] = [
  build("Bruna de Carvalho", "administradora", "Comunicação", "Administradora da Plataforma"),
];

export function findAccountById(id: string): MockAccount | undefined {
  return MOCK_ACCOUNTS.find((a) => a.id === id);
}
