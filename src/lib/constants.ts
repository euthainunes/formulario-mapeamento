import {
  LayoutDashboard,
  Users,
  LogIn,
  Newspaper,
  Sparkles,
  Heart,
  Boxes,
  IdCard,
  Award,
  FileBarChart,
  BrainCircuit,
  UsersRound,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { PermissionKey } from "@/types/auth";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: PermissionKey;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard Executivo", href: "/", icon: LayoutDashboard, permission: "dashboard.view" },
  { label: "Pessoas e Audiência", href: "/pessoas-audiencia", icon: Users, permission: "audience.view" },
  { label: "Acessos", href: "/acessos", icon: LogIn, permission: "access.view" },
  { label: "Conteúdos e Notícias", href: "/conteudos", icon: Newspaper, permission: "content.view" },
  { label: "Beezz", href: "/beezz", icon: Sparkles, permission: "beezz.view" },
  { label: "Engajamento e Reações", href: "/engajamento", icon: Heart, permission: "engagement.view" },
  { label: "Pods", href: "/pods", icon: Boxes, permission: "pods.view" },
  { label: "Diretório e Perfis", href: "/diretorio", icon: IdCard, permission: "directory.view" },
  { label: "Reconhecimento", href: "/reconhecimento", icon: Award, permission: "awards.view" },
  { label: "Relatórios e Exportações", href: "/relatorios", icon: FileBarChart, permission: "report.view" },
  { label: "Insights com IA", href: "/insights-ia", icon: BrainCircuit, permission: "insights.view" },
  { label: "Gestão do Time", href: "/gestao-do-time", icon: UsersRound, permission: "team-management.view" },
  { label: "Administração", href: "/administracao/visao-geral", icon: Settings, permission: "admin.view" },
];

export const ADMIN_SUBNAV = [
  { label: "Visão geral", href: "/administracao/visao-geral", permission: "admin.view" as PermissionKey },
  { label: "Usuários", href: "/administracao/usuarios", permission: "user.manage" as PermissionKey },
  {
    label: "Perfis e permissões",
    href: "/administracao/perfis-permissoes",
    permission: "role.manage" as PermissionKey,
  },
  {
    label: "Integrações",
    href: "/administracao/integracoes",
    permission: "integration.manage" as PermissionKey,
  },
  { label: "Sincronizações", href: "/administracao/sincronizacoes", permission: "sync.view" as PermissionKey },
  { label: "Alertas", href: "/administracao/alertas", permission: "alert.manage" as PermissionKey },
  { label: "Auditoria", href: "/administracao/auditoria", permission: "audit.view" as PermissionKey },
];

export const TEAM_MANAGEMENT_SUBNAV = [
  { label: "Visão geral", href: "/gestao-do-time", permission: "team-management.view" as PermissionKey },
  { label: "Quadro", href: "/gestao-do-time/quadro", permission: "team-management.view" as PermissionKey },
  { label: "Tarefas", href: "/gestao-do-time/tarefas", permission: "team-management.view" as PermissionKey },
  { label: "Carga do Time", href: "/gestao-do-time/carga", permission: "team-management.view" as PermissionKey },
  { label: "Campanhas", href: "/gestao-do-time/campanhas", permission: "team-management.view" as PermissionKey },
  { label: "Agenda", href: "/gestao-do-time/agenda", permission: "team-management.view" as PermissionKey },
  { label: "Documentos", href: "/gestao-do-time/documentos", permission: "team-management.view" as PermissionKey },
];

export const ORG_FILTER_DISABLED_TOOLTIP = "Disponível após validação da integração";

export const DEMO_BADGE_TEXT = "Ambiente demonstrativo — dados fictícios";

export const COMPANIES = ["BeeHome Matriz", "BeeHome Filial SP", "BeeHome Filial RJ"];
export const DEPARTMENTS = [
  "Comunicação",
  "Marketing",
  "Recursos Humanos",
  "Tecnologia",
  "Comercial",
  "Operações",
  "Financeiro",
];
export const JOB_TITLES = [
  "Analista",
  "Coordenador(a)",
  "Especialista",
  "Gerente",
  "Assistente",
  "Diretor(a)",
];
export const TEAMS = [
  "Time Conteúdo",
  "Time Growth",
  "Time Produto",
  "Time Pessoas",
  "Time Vendas",
  "Time Infraestrutura",
];
