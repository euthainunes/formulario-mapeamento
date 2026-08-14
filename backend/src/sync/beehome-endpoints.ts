/**
 * Catálogo FECHADO de endpoints da BeeHome. Esta é a ÚNICA lista de
 * endpoints com a qual o BeeHomeConnector pode se comunicar — não adicione
 * novos paths aqui sem confirmação explícita da equipe BeeHome.
 *
 * Fonte: "Documentação de APIs — BeeHome (Rede Américas)", versão 2.0,
 * 19/05/2026 (documento oficial recebido do time BeeHome em 14/08/2026).
 * Isso substitui as suposições anteriores — CONFIRMADO pelo documento:
 *  - Tenant: conectamericas. Base URL: https://conectamericas.mybeehome.com
 *  - Autenticação: header `Authorization: Bearer <jwt>`. JWT assinado
 *    HMAC-SHA256, claims de tenant/usuário/expiração. Sem sessão
 *    server-side nem cookie — o tenant é resolvido a partir do token.
 *  - Método HTTP de cada endpoint (ver campo `method` abaixo) — todos os
 *    endpoints de consulta/listagem são GET; todos os de exportação
 *    (`export...`) são POST e retornam um arquivo .xls (não JSON).
 *  - Parâmetros de cada endpoint (ver campo `params` abaixo).
 *  - Código de status: 200/202 sucesso, 401 token ausente/expirado/inválido,
 *    403 token válido mas sem a permissão/role exigida no pod/módulo, 500
 *    erro de servidor.
 *  - Cada endpoint exige que a CONTA associada ao token tenha o papel
 *    (role) correto no pod correspondente (ex: MANAGER_NEWS, MANAGER_BEEZZ,
 *    isAdministrator) — um 403 pode significar token ok mas conta sem
 *    aquela permissão específica, não necessariamente um erro de integração.
 *
 * AINDA NÃO CONFIRMADOS (mesmo com o documento oficial em mãos):
 *  - Formato exato do payload de resposta de cada endpoint (o documento
 *    descreve o CONTEÚDO em prosa — ex: "JSON — activeUsers,
 *    monthlyActiveUsers, engagedUsers etc." — mas não o schema JSON literal
 *    campo a campo). O código de normalização deve tratar campos ausentes
 *    de forma defensiva até uma chamada real ser validada.
 *  - Existência/formato de paginação em detalhe (alguns endpoints mencionam
 *    "JSON paginado" com `{ data: { list, totalElements, totalPages } }`,
 *    mas isso não foi confirmado para todos os que temos como "paginado").
 *  - Ciclo de vida do token: o JWT fornecido como exemplo tem um claim
 *    aninhado `token.exp` em MILISSEGUNDOS (não segundos — foge do padrão
 *    RFC 7519, que usa segundos no claim `exp` de nível superior), e a
 *    própria estrutura do payload é não-padrão (não são claims JWT normais
 *    no nível raiz, e sim um objeto `{ message, token: {...} }` — parece o
 *    corpo bruto da resposta de login serializado como payload do JWT).
 *    Ciclo de renovação (refresh) não documentado.
 *  - Rate limits (além do tratamento genérico de 429 já implementado).
 *  - Três endpoints têm o path exato cortado no PDF recebido (quebra de
 *    página no meio da tabela) — o nome abaixo é inferido pelo contexto
 *    (referenciado por nome no endpoint de exportação irmão, ou pela rota
 *    da tela), mas PRECISA ser confirmado antes de uso: ver
 *    `directoryListUsers`, `directoryLoginAudit` e `insightsAccessByYear`.
 */
export const BEEHOME_ENDPOINTS = {
  // ---- Insights de pessoas (tela /insights/people — estritamente admin) ----
  /** GET. Params: listCompany, listCompanyDepartment, listDepartment, listGroup, listJobTitle, listTeam, tz. Retorno: activeUsers, monthlyActiveUsers, engagedUsers etc. (atual + semana anterior). */
  peopleToday: '/api/insights/peopleToday',
  /** GET. Params: startDate, endDate, listCompany, listCompanyDepartment, listDepartment, listGroup, listJobTitle, listTeam. Retorno: série temporal { activeUsers, dailyActiveUsers, weeklyActiveUsers, monthlyActiveUsers, engagedUsers, dayString }. */
  peopleChart: '/api/insights/people/chart',
  /** GET. Params: startDate, endDate (+ filtros padrão). Retorno: distribuição por dispositivo. CORRIGIDO — path anterior era o palpite errado "/device". */
  device: '/api/insights/people/chart/device',
  /** GET. Params: startDate, type. Retorno: tabela detalhada. CORRIGIDO — path anterior era o palpite errado "/api/insights/people/table" (faltava "/chart"). */
  peopleTable: '/api/insights/people/chart/table',

  // ---- Insights de reação (tela /insights/reaction — estritamente admin) — NOVO, não existia no catálogo anterior ----
  /** GET. Params: type, startDate, endDate, groupId, companyId, companyDepartmentId, singleAccess. `type` é um dos 12 valores documentados: countBeezzLiked, countCommentsBeezz, countBeezzCommentLike, countNewsLiked, countCommentsNews, countNewsCommentLike, countVideoLiked, countCommentsVideos, countPollLiked, countPhotobookLiked, countBlogLiked, countPodcastLiked. Retorno: série temporal por tipo de reação. Alimenta o módulo Engajamento e Reações. */
  reaction: '/api/insights/reaction',

  // ---- Auditoria de login (tela /insights/access — estritamente admin) ----
  /** GET. Params: startDate, endDate, groupId, singleAccess, companyList, companyDepartmentList, userZone. Retorno: total de logins. */
  auditLogins: '/audit/logins',
  /** GET. Params: startDate, endDate, groupId, singleAccess, companyList, companyDepartmentList. Retorno: logins por data. */
  auditLoginsByDate: '/audit/loginsByDate',
  /** GET. Mesmos params de auditLoginsByDate. Retorno: média de logins por hora. */
  auditAverageLoginsByHour: '/audit/averageLoginsByHour',
  /** GET. Mesmos params de auditLoginsByDate. Retorno: média de logins por dia da semana. */
  auditAverageLoginsByDay: '/audit/averageLoginsByDay',
  /** POST (CORRIGIDO — antes assumido como GET). Body: mesmos filtros de loginsByDate/ByHour/ByDay conforme o relatório solicitado. Retorno: arraybuffer .xls (NÃO é JSON). */
  auditExportLoginsByDate: '/audit/export/loginsByDate',
  /** GET, path exato cortado no PDF (quebra de página) — inferido pelo contexto da tela /insights/access (params: year). Retorno: usuários ativos por mês no ano. NÃO CONFIRMAR sem validar contra a API real. */
  insightsAccessByYear: '/api/insights/access',

  // ---- Notícias (tela /news/manager/dashboard) ----
  /** GET. Params: companyList, companyDepartmentList, departmentList, jobTitleList, startDate, endDate, uniqueViews. Auth: isManager(POD_NEWS_MANAGER_NEWS). Retorno: notícias mais vistas com contadores. */
  newsListMostViewedNews: '/news/listMostViewedNews',
  /** GET. Mesmos params (sem uniqueViews). Retorno: notícias mais curtidas. */
  newsListMostLikedNews: '/news/listMostLikedNews',
  /** GET. Mesmos params. Retorno: notícias mais comentadas. */
  newsListMostCommentedNews: '/news/listMostCommentedNews',
  /** GET. Params: startDate, endDate. Retorno: série temporal de notícias publicadas. */
  newsGetPublishedNewsChart: '/news/getPublishedNewsChart',

  // ---- Beezz (tela /beezz/manager/trends) ----
  /** GET. Params: pageNumber, pageSize. Retorno: top Beezz por curtidas (paginado). */
  beedataBeezzLikeTop: '/beedata/beezz/like/top',
  /** GET, sem params. Retorno: contagem total. NOVO — não existia no catálogo anterior. */
  beedataBeezzLikeTopCount: '/beedata/beezz/like/top/count',
  /** GET. Params: maxResults (default 10). Retorno: top Beezz por comentários. */
  beedataBeezzCommentTop: '/beedata/beezz/comment/top',
  /** GET. Params: maxResults (default 10). Retorno: top usuários criadores de Beezz. */
  beedataUserCreateBeezzTop: '/beedata/user/create/beezz/top',
  /** GET. Params: userZone, startDate, endDate, textSearch. Auth: admin OU MANAGER_DASHBOARD OU POD_BEEZZ_MANAGER_BEEZZ. Retorno: timeline de atividade por data. */
  auditListTimelineByDate: '/audit/list/listTimelineByDate',
  /** GET. Params: startDate, endDate, textSearch. Mesma auth acima. Retorno: reações em Beezz no período. NOVO — não existia no catálogo anterior. */
  auditBeezzReactions: '/audit/beezz/reactions',

  // ---- Diretório / relatórios (tela /directory/admin/reports) ----
  /** GET, path exato cortado no PDF — inferido por ser referenciado como "listUsersExport" no endpoint de exportação irmão (exportUsersReport, abaixo). Params: start, length, loggedOption, verifiedUsers, status, jobTitleId, departmentId, companyId, companyDepartmentId, text, requestData, startDate, endDate, isNewUserStatusLogic (paginação estilo DataTables — start/length). Retorno: JSON paginado { data: { list, totalElements, totalPages } } — relatório "Lista de usuários". NÃO CONFIRMAR sem validar o path exato com o time BeeHome. */
  directoryListUsersExport: '/directory/listUsersExport',
  /** POST. Body: mesmos filtros de directoryListUsersExport. Retorno: arquivo .xls — exportação "Lista de usuários". */
  directoryExportUsersReport: '/directory/exportUsersReport',
  /** GET. Params: filtros de listUsersExport + requestData (skills). Retorno: JSON paginado "Lista de usuários com informações de perfil" (inclui skills). */
  directoryListUsersSkillsExportNew: '/directory/listUsersSkillsExport/new',
  /** POST. Body: startDate, endDate, userId, companyId, byEmail, uniqueAccess, userZone. Auth: admin OU POD_DIRECTORY_MANAGER. Retorno: arquivo .xls — exportação "Acesso dos usuários" (tentativas de login). */
  auditExportReportLoginAudit: '/audit/exportReportLoginAudit',

  // ---- Pods (tela /insights/pods — estritamente admin) ----
  /** GET. Params: companyList, startDate, endDate. Retorno: pods mais acessados (rankeados). */
  podAuditListMostAccessed: '/pod/audit/list/mostAccessed',
  /** GET. Mesmos params. Retorno: pods menos acessados. */
  podAuditListLeastAccessed: '/pod/audit/list/leastAccessed',

  // ---- Premiações / Admission Award (tela /admissionAward — sem guard, qualquer usuário autenticado) ----
  /** GET, sem params relevantes de negócio (forceUpdate, userZone). Retorno: JSON boolean. */
  awardCheck: '/api/award/check',
  /** GET, sem params. Retorno: JSON boolean. */
  awardUsersCheck: '/api/award/users/check',
  /** GET. Params: today, first, pageSize. Retorno: JSON paginado — colaboradores aniversariantes de admissão (id, userName, admission, anos de empresa, photo). */
  awardListAdmissionAwardByMonth: '/api/award/list/admissionAwardByMonth',
} as const;

export type BeeHomeEndpointAlias = keyof typeof BEEHOME_ENDPOINTS;

/** Endpoints cujo método real é POST e cuja resposta é um arquivo binário (.xls), não JSON — o BeeHomeConnector precisa tratá-los de forma diferente dos GETs que retornam JSON. */
export const BEEHOME_BINARY_EXPORT_ENDPOINTS: readonly BeeHomeEndpointAlias[] = [
  'auditExportLoginsByDate',
  'directoryExportUsersReport',
  'auditExportReportLoginAudit',
] as const;
