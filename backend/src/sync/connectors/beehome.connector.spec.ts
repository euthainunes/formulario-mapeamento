import nock from 'nock';
import { ConfigService } from '@nestjs/config';
import { BeeHomeConnector, BeeHomeApiError } from './beehome.connector';

describe('BeeHomeConnector', () => {
  const BASE_URL = 'https://tenant-x.beehome.example.com';
  const SECRET_TOKEN = 'super-secret-jwt-token-should-never-leak';

  function makeConnector(overrides: Record<string, string> = {}) {
    const values: Record<string, string> = {
      BEEHOME_BASE_URL: BASE_URL,
      BEEHOME_BEARER_TOKEN: SECRET_TOKEN,
      BEEHOME_RETRY_BASE_MS: '1',
      BEEHOME_MAX_RETRIES: '3',
      BEEHOME_TIMEOUT_MS: '2000',
      ...overrides,
    };
    const config = { get: (key: string) => values[key] } as unknown as ConfigService;
    return new BeeHomeConnector(config);
  }

  afterEach(() => {
    nock.cleanAll();
  });

  it('faz GET autenticado e retorna o payload em caso de sucesso', async () => {
    const scope = nock(BASE_URL)
      .get('/audit/loginsByDate')
      .matchHeader('authorization', `Bearer ${SECRET_TOKEN}`)
      .reply(200, { data: [{ date: '2026-08-01', total: 42 }] });

    const connector = makeConnector();
    const result = await connector.getLoginsByDate();

    expect(result).toEqual({ data: [{ date: '2026-08-01', total: 42 }] });
    expect(scope.isDone()).toBe(true);
  });

  it('não tenta novamente em 401 e não vaza o token na mensagem de erro', async () => {
    const scope = nock(BASE_URL).get('/audit/logins').reply(401, { message: 'unauthorized' });

    const connector = makeConnector();

    let caught: unknown;
    try {
      await connector.getLogins();
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(BeeHomeApiError);
    expect((caught as BeeHomeApiError).status).toBe(401);
    expect((caught as Error).message).not.toContain(SECRET_TOKEN);
    // A interceptação só foi consumida uma vez — prova que não houve retry.
    expect(scope.isDone()).toBe(true);
    expect(nock.pendingMocks()).toHaveLength(0);
  });

  it('não tenta novamente em 403', async () => {
    nock(BASE_URL).get('/pod/audit/list/mostAccessed').reply(403, { message: 'forbidden' });

    const connector = makeConnector();
    await expect(connector.getPodMostAccessed()).rejects.toMatchObject({ status: 403 });
  });

  it('faz retry exponencial em 429 e eventualmente sucede', async () => {
    const scope = nock(BASE_URL)
      .get('/news/listMostLikedNews')
      .reply(429, { message: 'too many requests' })
      .get('/news/listMostLikedNews')
      .reply(200, { data: [] });

    const connector = makeConnector();
    const result = await connector.listMostLikedNews();

    expect(result).toEqual({ data: [] });
    expect(scope.isDone()).toBe(true);
  });

  it('faz retry em erro 5xx e desiste após esgotar as tentativas', async () => {
    nock(BASE_URL).get('/beedata/beezz/like/top').times(4).reply(500, { message: 'internal error' });

    const connector = makeConnector({ BEEHOME_MAX_RETRIES: '3' });
    await expect(connector.getTopBeezzLikes()).rejects.toMatchObject({ status: 500 });
  });
});
