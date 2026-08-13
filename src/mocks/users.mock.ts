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

export const MOCK_ACCOUNTS: MockAccount[] = [
  build("Bruna Albuquerque", "administradora", "Comunicação", "Administradora da Plataforma"),
  build("Thainá Nunes", "gestao-comunicacao", "Comunicação", "Analista de Comunicação"),
  build("Mariana Souza", "gestao-comunicacao", "Comunicação", "Coordenadora de Comunicação"),
  build("Hector Ramos", "gestao-comunicacao", "Comunicação", "Especialista de Conteúdo"),
  build("Camila Duarte", "colaborador", "Marketing", "Analista de Marketing"),
  build("Carol Ferraz", "colaborador", "Recursos Humanos", "Assistente de RH"),
  build("Larissa Prado", "colaborador", "Tecnologia", "Analista de Sistemas"),
  build("Sarah Lima", "gestao-comunicacao", "Comunicação", "Analista de Comunicação"),
];

export function findAccountById(id: string): MockAccount | undefined {
  return MOCK_ACCOUNTS.find((a) => a.id === id);
}
