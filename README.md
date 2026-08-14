# Gestão da Comunicação + Inteligência da Intranet BeeHome

SaaS composto por dois pacotes neste repositório:

- **`src/`** (raiz): front-end Next.js 16 + TypeScript. Roda em dois modos, controlados por `NEXT_PUBLIC_APP_MODE`:
  - `mock` (**padrão**, sem nenhuma dependência externa) — dados 100% simulados em memória, usado para demonstração pública.
  - `api` — dados reais, via Route Handlers do próprio Next.js (`src/app/api/*`) atuando como BFF autenticado para o backend.
- **`backend/`** — NestJS + Prisma/PostgreSQL: módulos de domínio, autenticação JWT/RBAC própria do SaaS, conector da Intranet BeeHome, orquestrador de sincronização, alertas, relatórios e insights determinísticos. Roda em `PORT=3001` por padrão, Swagger em `/docs`.

## Modo mock (padrão — sem dependências)

É o que roda "do jeito que já vem":

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Não é preciso subir o backend, Postgres ou Redis — tudo é servido por `src/services/mock/*`. A tela de login lista usuárias fictícias para simular sessões sem senha.

## Modo api (dados reais, ponta a ponta)

### Arquitetura: Next.js como BFF (Backend for Frontend)

O JWT do SaaS (emitido pelo backend) **nunca** fica acessível a JavaScript do navegador. O fluxo é:

1. O browser chama `POST /api/auth/login` (Route Handler, roda no servidor Next.js).
2. Esse handler chama o backend NestJS (`POST {BACKEND_INTERNAL_URL}/auth/login`) e, se as credenciais forem válidas, guarda o JWT retornado em um cookie **httpOnly**, `secure` (em produção) e `sameSite=lax`. O token nunca volta no corpo da resposta ao client — só o perfil (nome, e-mail, permissões).
3. Para cada domínio (dashboard, audiência, acessos, conteúdos, beezz, engajamento, pods, diretório, reconhecimento, relatórios, alertas, insights, sync, admin), existe um Route Handler correspondente em `src/app/api/*` que lê o cookie httpOnly no servidor, monta `Authorization: Bearer <token>` e repassa a chamada ao backend — devolvendo o JSON ao client.
4. O browser conversa **somente** com a própria origem do Next.js (same-origin, sem CORS, sem exposição de token). As classes `Api*Repository` em `src/services/repositories/*.repository.ts` chamam esses Route Handlers via `fetch("/api/...")`.

O perfil do usuário (nome/e-mail/permissões — **nunca o token**) é mantido em `zustand`/`localStorage` (`beehome-demo-auth`) só para exibição de UI, igual ao que o modo mock já fazia — é seguro porque não é o segredo de autenticação.

### 1. Subir Postgres e Redis

```bash
cd backend
docker compose up -d postgres redis
```

Isso sobe Postgres 16 na porta `5432` (usuário/senha/banco `beehome`/`beehome`/`beehome_backend`) e Redis 7 na porta `6379`, com healthcheck. Para parar depois: `docker compose down` (os dados ficam no volume `beehome_postgres_data` a menos que você use `docker compose down -v`).

> Se o seu ambiente não tiver acesso ao Docker Hub (ex: rede corporativa restrita), qualquer Postgres 16 e Redis 7 acessíveis localmente funcionam — só ajuste `DATABASE_URL`/`REDIS_URL` em `backend/.env`.

### 2. Configurar variáveis de ambiente do backend

```bash
cd backend
cp .env.example .env
# edite JWT_SECRET, DATABASE_URL etc. se necessário — os valores default já
# apontam para o Postgres/Redis do docker-compose acima.
```

### 3. Rodar as migrations e o seed

```bash
cd backend
npx prisma migrate deploy   # aplica as migrations versionadas em prisma/migrations
npx prisma db seed          # popula o tenant "BeeHome Brasil"
```

(Se você alterar `prisma/schema.prisma`, gere uma nova migration com `npx prisma migrate dev --name minha_mudanca` em vez de `migrate deploy`.)

O seed cria o tenant **BeeHome Brasil** (`slug: beehome-brasil`) com:

- **Bruna Albuquerque** — Administradora (todas as permissões).
- **Thainá Nunes, Mariana Souza, Hector Ramos, Sarah Lima** — Gestão de Comunicação.
- **Camila Duarte, Carol Ferraz, Larissa Prado** — Colaboradoras.
- Senha para todas: **`beehome123`**. E-mails no formato `nome.sobrenome@beehomebrasil.com.br` (impresso no console ao rodar o seed).
- Company/Department/JobTitle/Team básicas, e um volume pequeno mas real de dados: ~10 News, ~15 Beezz, ~120 LoginEvent (14 dias), 3 Pods, 18 snapshots de Reaction, AdmissionAward do mês atual/anterior, 1 AlertRule + 1 Alert de exemplo e 1 SyncJob concluído.

> O volume é deliberadamente modesto (o objetivo é provar que o pipeline funciona ponta a ponta, não replicar os ~90 dias de série histórica dos mocks do front-end).

### 4. Subir o backend

```bash
cd backend
npm install
npm run start:dev   # http://localhost:3001, Swagger em /docs
```

### 5. Subir o front-end em modo `api`

Em outro terminal, na raiz do repositório:

```bash
cp .env.example .env.local
# .env.local já vem com NEXT_PUBLIC_APP_MODE=api apontando para
# BACKEND_INTERNAL_URL=http://localhost:3001 — ajuste se necessário.
npm install
npm run dev
```

Abra [http://localhost:3000/login](http://localhost:3000/login) e entre com um dos e-mails do seed (tenant `beehome-brasil`, senha `beehome123`).

### Variáveis de ambiente

| Variável | Onde | Descrição |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_MODE` | raiz (`.env.local`) | `mock` (padrão) ou `api`. Prefixo `NEXT_PUBLIC_` porque é lido também no bundle do navegador (factories de repository). |
| `BACKEND_INTERNAL_URL` | raiz (`.env.local`) | URL do backend NestJS, usada **somente no servidor** (Route Handlers) — nunca chega ao browser. |
| `NEXT_PUBLIC_DEFAULT_TENANT_SLUG` | raiz (`.env.local`) | Preenche o campo "Tenant" da tela de login em modo `api` (conveniência, campo continua editável). |
| `DATABASE_URL` | `backend/.env` | Connection string do Postgres. |
| `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | `backend/.env` | Configuração do JWT do próprio SaaS. |
| `FRONTEND_URL` | `backend/.env` | Origem permitida no CORS do backend (`app.enableCors`). Na prática pouco exercitada, já que a comunicação real é servidor-a-servidor (Next.js BFF → backend). |
| `BEEHOME_BASE_URL`, `BEEHOME_BEARER_TOKEN`, ... | `backend/.env` | Configuração do conector real da Intranet BeeHome (fora do escopo desta tarefa de integração front↔backend). |
| `REDIS_URL`, `SYNC_QUEUE_DRIVER` | `backend/.env` | Fila BullMQ do SyncModule (default: `memory`, sem depender de Redis estar de pé). |

## Verificação de ponta a ponta

Comandos exatos usados para validar (a partir da raiz do repositório):

```bash
# 1) Infra
cd backend && docker compose up -d postgres redis   # ou Postgres/Redis locais equivalentes

# 2) Backend
cd backend
npx prisma migrate deploy
npx prisma db seed
npm run start:dev &         # http://localhost:3001

# 3) Front-end em modo api
cd ..
NEXT_PUBLIC_APP_MODE=api BACKEND_INTERNAL_URL=http://localhost:3001 npm run dev &   # http://localhost:3000

# 4) Login real via BFF (cookie httpOnly, sem token no JSON de resposta)
curl -sS -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"tenantSlug":"beehome-brasil","email":"bruna.albuquerque@beehomebrasil.com.br","password":"beehome123"}'

# 5) Páginas com dados reais do Postgres, via BFF
curl -sS -b cookies.txt http://localhost:3000/api/dashboard
curl -sS -b cookies.txt http://localhost:3000/api/directory
curl -sS -b cookies.txt http://localhost:3000/api/content
curl -sS -b cookies.txt http://localhost:3000/api/reports
```

Para parar tudo: `Ctrl+C` nos processos `npm run start:dev` / `npm run dev`, e `cd backend && docker compose down` (ou pare o Postgres/Redis locais).

## Backend — comandos úteis

```bash
cd backend
npx prisma validate        # valida o schema
npm run build               # nest build
npm test                    # 11 testes (mocks/in-memory, não dependem de banco)
npx eslint "{src,test}/**/*.ts"
```

## Front-end — comandos úteis

```bash
npm run build
npx eslint src
```

## CI

`.github/workflows/ci.yml` roda em push/PR para qualquer branch, com dois jobs em paralelo:

- **frontend**: `npm ci`, `npm run build` (modo mock, sem dependências), `npx eslint src`.
- **backend**: `npm ci`, `npx prisma generate`, `npx prisma validate`, `npx prisma migrate deploy` (contra um serviço `postgres:16` nativo do GitHub Actions), `npm run build`, `npm test`.

## Estrutura

```
src/                          Front-end Next.js (App Router)
  app/api/*                   Route Handlers = BFF autenticado (modo api)
  lib/server/                 Helpers server-only (cookie httpOnly, proxy ao backend)
  lib/client/                 Helpers client-only (fetch com tratamento de 401)
  services/contracts/*        Interfaces dos domínios (I*Repository)
  services/mock/*             Implementações mock (dados em memória)
  services/repositories/*     Factories mock/api por domínio (appConfig.dataSource)
backend/                      Backend NestJS + Prisma
  src/auth/                   JWT + RBAC próprios do SaaS
  src/analytics/*             Serviços de cada domínio (audiência, acessos, ...)
  src/sync/                   Conector BeeHome + orquestrador de sincronização
  prisma/schema.prisma        Schema multi-tenant
  prisma/seed.ts              Seed do tenant "BeeHome Brasil"
```
