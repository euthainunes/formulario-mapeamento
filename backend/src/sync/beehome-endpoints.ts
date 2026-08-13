/**
 * Catálogo FECHADO de endpoints da BeeHome. Esta é a ÚNICA lista de
 * endpoints com a qual o BeeHomeConnector pode se comunicar — não adicione
 * novos paths aqui sem confirmação explícita da equipe BeeHome.
 *
 * NÃO SÃO CONHECIDOS (e precisam de validação técnica antes de produção):
 *  - Método HTTP exato de cada endpoint (assumimos GET abaixo como ponto de
 *    partida mais provável para endpoints de consulta/relatório, mas isso
 *    é uma SUPOSIÇÃO, não um fato confirmado).
 *  - Nomes e formato exato dos parâmetros de query/body (datas, paginação).
 *  - Existência e formato de paginação (cursor? page/pageSize? limit/offset?).
 *  - Formato exato do payload de resposta de cada endpoint.
 *  - Ciclo de vida do token Bearer (expiração, renovação, refresh).
 *  - Rate limits (além do tratamento genérico de 429 já implementado).
 */
export const BEEHOME_ENDPOINTS = {
  peopleToday: '/api/insights/peopleToday',
  peopleChart: '/api/insights/people/chart',
  peopleTable: '/api/insights/people/table',
  device: '/device',
  auditLogins: '/audit/logins',
  auditLoginsByDate: '/audit/loginsByDate',
  auditAverageLoginsByHour: '/audit/averageLoginsByHour',
  auditAverageLoginsByDay: '/audit/averageLoginsByDay',
  auditExportLoginsByDate: '/audit/export/loginsByDate',
  newsGetPublishedNewsChart: '/news/getPublishedNewsChart',
  newsListMostViewedNews: '/news/listMostViewedNews',
  newsListMostLikedNews: '/news/listMostLikedNews',
  newsListMostCommentedNews: '/news/listMostCommentedNews',
  beedataBeezzLikeTop: '/beedata/beezz/like/top',
  beedataBeezzCommentTop: '/beedata/beezz/comment/top',
  beedataUserCreateBeezzTop: '/beedata/user/create/beezz/top',
  auditListTimelineByDate: '/audit/list/listTimelineByDate',
  podAuditListMostAccessed: '/pod/audit/list/mostAccessed',
  podAuditListLeastAccessed: '/pod/audit/list/leastAccessed',
  awardCheck: '/api/award/check',
  awardUsersCheck: '/api/award/users/check',
  awardListAdmissionAwardByMonth: '/api/award/list/admissionAwardByMonth',
} as const;

export type BeeHomeEndpointAlias = keyof typeof BEEHOME_ENDPOINTS;
