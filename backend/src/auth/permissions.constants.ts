/**
 * Catálogo fixo de permissões do SaaS.
 *
 * IMPORTANTE: estas strings são as definidas EXPLICITAMENTE na especificação
 * funcional deste backend. Elas não coincidem 1:1 com as strings hoje usadas
 * pelo mock do front-end em `src/types/auth.ts` (que usa, por exemplo,
 * "reports.view"/"reports.export"/"admin.*" em vez de "report.view"/
 * "report.export"/"user.manage"/"role.manage"/"integration.manage"/
 * "sync.view"/"audit.view"/"settings.manage", e não possui "awards.view"
 * nem "insights.ask"). Essa divergência é conhecida — o front-end mockado
 * ainda não foi migrado para consumir este backend, e a spec deste backend
 * pede explicitamente esta lista. Ajustar quando o front-end for integrado.
 */
export const PERMISSION_KEYS = [
  'dashboard.view',
  'audience.view',
  'access.view',
  'content.view',
  'beezz.view',
  'engagement.view',
  'pods.view',
  'directory.view',
  'awards.view',
  'report.view',
  'report.export',
  'insights.view',
  'insights.ask',
  'alert.view',
  'alert.manage',
  'user.manage',
  'role.manage',
  'integration.manage',
  'sync.view',
  'audit.view',
  'settings.manage',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const PERMISSION_DESCRIPTIONS: Record<PermissionKey, string> = {
  'dashboard.view': 'Visualizar o dashboard executivo',
  'audience.view': 'Visualizar dados de audiência',
  'access.view': 'Visualizar dados de acesso/login',
  'content.view': 'Visualizar dados de conteúdo (notícias etc.)',
  'beezz.view': 'Visualizar dados de Beezz',
  'engagement.view': 'Visualizar dados de engajamento/reações',
  'pods.view': 'Visualizar dados de pods',
  'directory.view': 'Visualizar diretório de colaboradores',
  'awards.view': 'Visualizar premiações/reconhecimento',
  'report.view': 'Visualizar histórico de relatórios',
  'report.export': 'Gerar/exportar relatórios',
  'insights.view': 'Visualizar insights automáticos',
  'insights.ask': 'Fazer perguntas à camada de insights',
  'alert.view': 'Visualizar alertas',
  'alert.manage': 'Gerenciar regras de alerta e transicionar status',
  'user.manage': 'Gerenciar usuários',
  'role.manage': 'Gerenciar papéis e permissões',
  'integration.manage': 'Gerenciar integrações',
  'sync.view': 'Visualizar status/histórico de sincronização',
  'audit.view': 'Visualizar log de auditoria',
  'settings.manage': 'Gerenciar configurações do tenant',
};

/** Papéis padrão criados no seed de cada tenant novo. */
export const DEFAULT_ROLES: { key: string; name: string; description: string; permissions: PermissionKey[] }[] = [
  {
    key: 'administradora',
    name: 'Administradora',
    description: 'Acesso completo ao SaaS',
    permissions: [...PERMISSION_KEYS],
  },
  {
    key: 'gestao-comunicacao',
    name: 'Gestão da Comunicação',
    description: 'Acesso aos dashboards, relatórios, insights e alertas',
    permissions: [
      'dashboard.view',
      'audience.view',
      'access.view',
      'content.view',
      'beezz.view',
      'engagement.view',
      'pods.view',
      'directory.view',
      'awards.view',
      'report.view',
      'report.export',
      'insights.view',
      'insights.ask',
      'alert.view',
      'alert.manage',
      'sync.view',
    ],
  },
  {
    key: 'colaborador',
    name: 'Colaborador',
    description: 'Acesso somente ao dashboard executivo',
    permissions: ['dashboard.view'],
  },
];
