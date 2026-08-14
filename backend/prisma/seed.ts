/**
 * Seed de desenvolvimento do tenant real "BeeHome Brasil":
 *  - Catálogo de Permission (as 20 chaves fixas do sistema).
 *  - Papéis padrão (administradora, gestao-comunicacao, colaborador) com as
 *    permissões default (DEFAULT_ROLES) — só existem hoje como catálogo
 *    disponível; nenhuma colaboradora além da Bruna tem um papel atribuído.
 *  - Company/Department/JobTitle/Team básicas.
 *  - Bruna é a ÚNICA usuária com login real (senha demo conhecida + papel
 *    administradora). As demais colaboradoras da Comunicação (mesmos nomes
 *    do mock do front-end, src/mocks/team.mock.ts) continuam existindo como
 *    linhas de `User` — necessário porque News/Beezz/LoginEvent/AdmissionAward
 *    referenciam autoria por usuária — mas SEM papel atribuído e com uma
 *    senha aleatória nunca revelada, então não conseguem logar de fato nem
 *    teriam qualquer permissão caso a senha fosse comprometida. Elas são
 *    dado rastreado (as pessoas cujos indicadores a Bruna analisa), não
 *    contas do SaaS.
 *  - Um volume pequeno mas real de News, Beezz, LoginEvent, Pod, Reaction,
 *    AdmissionAward e um AlertRule/Alert de exemplo — o suficiente para provar
 *    que o pipeline funciona ponta a ponta, sem tentar replicar o volume dos
 *    mocks do front-end (90 dias de série histórica).
 *
 * Executar com: npx prisma db seed (requer DATABASE_URL apontando para um
 * Postgres real).
 */
import { randomBytes } from 'crypto';
import { PrismaClient, Device, Pod, News, Beezz } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PERMISSION_KEYS, PERMISSION_DESCRIPTIONS, DEFAULT_ROLES } from '../src/auth/permissions.constants';

const prisma = new PrismaClient();

const TENANT_SLUG = 'beehome-brasil';
const DEMO_PASSWORD = 'beehome123';

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function daysAgo(days: number, hour = 9, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface SeedUserDef {
  name: string;
  /** null = colaboradora rastreada, sem papel/login real (ver comentário no topo do arquivo). */
  roleKey: string | null;
  department: string;
  jobTitle: string;
}

const USERS: SeedUserDef[] = [
  { name: 'Bruna Albuquerque', roleKey: 'administradora', department: 'Comunicação', jobTitle: 'Administradora da Plataforma' },
  { name: 'Thainá Nunes', roleKey: null, department: 'Comunicação', jobTitle: 'Analista de Comunicação' },
  { name: 'Mariana Souza', roleKey: null, department: 'Comunicação', jobTitle: 'Coordenadora de Comunicação' },
  { name: 'Hector Ramos', roleKey: null, department: 'Comunicação', jobTitle: 'Especialista de Conteúdo' },
  { name: 'Camila Duarte', roleKey: null, department: 'Comunicação', jobTitle: 'Analista de Comunicação' },
  { name: 'Carol Ferraz', roleKey: null, department: 'Comunicação', jobTitle: 'Analista de Comunicação' },
  { name: 'Larissa Prado', roleKey: null, department: 'Comunicação', jobTitle: 'Analista de Comunicação' },
  { name: 'Sarah Lima', roleKey: null, department: 'Comunicação', jobTitle: 'Analista de Comunicação' },
];

async function main() {
  // ---- Catálogo de permissões (global, não multi-tenant) ----
  for (const key of PERMISSION_KEYS) {
    await prisma.permission.upsert({
      where: { key },
      update: { description: PERMISSION_DESCRIPTIONS[key] },
      create: { key, description: PERMISSION_DESCRIPTIONS[key] },
    });
  }

  // ---- Tenant ----
  const tenant = await prisma.tenant.upsert({
    where: { slug: TENANT_SLUG },
    update: { name: 'BeeHome Brasil' },
    create: { name: 'BeeHome Brasil', slug: TENANT_SLUG },
  });

  // ---- Papéis padrão ----
  const roleByKey = new Map<string, { id: string }>();
  for (const roleDef of DEFAULT_ROLES) {
    const role = await prisma.role.upsert({
      where: { tenantId_key: { tenantId: tenant.id, key: roleDef.key } },
      update: { name: roleDef.name, description: roleDef.description },
      create: { tenantId: tenant.id, key: roleDef.key, name: roleDef.name, description: roleDef.description },
    });
    roleByKey.set(roleDef.key, role);

    const permissions = await prisma.permission.findMany({ where: { key: { in: roleDef.permissions } } });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissions.map((p) => ({ tenantId: tenant.id, roleId: role.id, permissionId: p.id })),
      });
    }
  }

  // ---- Organização básica ----
  const company = await prisma.company.upsert({
    where: { tenantId_sourceId: { tenantId: tenant.id, sourceId: 'beehome-brasil' } },
    update: { name: 'BeeHome Brasil' },
    create: { tenantId: tenant.id, sourceId: 'beehome-brasil', name: 'BeeHome Brasil' },
  });

  const departmentNames = ['Comunicação', 'Marketing', 'Recursos Humanos', 'Tecnologia'];
  const departmentByName = new Map<string, { id: string }>();
  for (const name of departmentNames) {
    const dept = await prisma.department.upsert({
      where: { tenantId_sourceId: { tenantId: tenant.id, sourceId: name } },
      update: { name, companyId: company.id },
      create: { tenantId: tenant.id, sourceId: name, name, companyId: company.id },
    });
    departmentByName.set(name, dept);
  }

  const team = await prisma.team.upsert({
    where: { tenantId_sourceId: { tenantId: tenant.id, sourceId: 'comunicacao-core' } },
    update: { name: 'Comunicação — Time Principal' },
    create: { tenantId: tenant.id, sourceId: 'comunicacao-core', name: 'Comunicação — Time Principal' },
  });

  const jobTitleByName = new Map<string, { id: string }>();
  for (const u of USERS) {
    if (jobTitleByName.has(u.jobTitle)) continue;
    const dept = departmentByName.get(u.department);
    const jt = await prisma.jobTitle.upsert({
      where: { tenantId_sourceId: { tenantId: tenant.id, sourceId: u.jobTitle } },
      update: { name: u.jobTitle, departmentId: dept?.id },
      create: { tenantId: tenant.id, sourceId: u.jobTitle, name: u.jobTitle, departmentId: dept?.id },
    });
    jobTitleByName.set(u.jobTitle, jt);
  }

  // ---- Usuárias ----
  const brunaPasswordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const trackedOnlyPasswordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
  const createdUsers: { id: string; email: string; name: string; canLogin: boolean }[] = [];

  for (const u of USERS) {
    const email = `${u.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '.')}@beehomebrasil.com.br`;
    const dept = departmentByName.get(u.department);
    const jt = jobTitleByName.get(u.jobTitle);
    const canLogin = u.roleKey !== null;
    const passwordHash = canLogin ? brunaPasswordHash : trackedOnlyPasswordHash;

    const user = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email } },
      update: {
        name: u.name,
        passwordHash,
        active: true,
        companyId: company.id,
        departmentId: dept?.id,
        jobTitleId: jt?.id,
        teamId: team.id,
        avatarInitials: initials(u.name),
      },
      create: {
        tenantId: tenant.id,
        name: u.name,
        email,
        passwordHash,
        active: true,
        companyId: company.id,
        departmentId: dept?.id,
        jobTitleId: jt?.id,
        teamId: team.id,
        avatarInitials: initials(u.name),
        metadataJson: { admissionDate: daysAgo(randomInt(120, 900)).toISOString(), birthDate: daysAgo(randomInt(0, 3650)).toISOString(), skills: [] },
      },
    });

    const role = u.roleKey ? roleByKey.get(u.roleKey) : undefined;
    if (role) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: { tenantId: tenant.id, userId: user.id, roleId: role.id },
      });
    } else {
      // Garante que nenhum papel fique preso de uma execução anterior do
      // seed (idempotência) para quem não deve ter acesso de login.
      await prisma.userRole.deleteMany({ where: { userId: user.id } });
    }

    createdUsers.push({ id: user.id, email, name: u.name, canLogin });
  }

  const loginableUsers = createdUsers.filter((u) => u.canLogin);
  // eslint-disable-next-line no-console
  console.log(
    `Tenant "${tenant.name}" (slug: ${TENANT_SLUG}) — ${createdUsers.length} colaboradoras no total, ${loginableUsers.length} com login real. Senha demo: "${DEMO_PASSWORD}".`,
  );
  for (const u of loginableUsers) {
    // eslint-disable-next-line no-console
    console.log(`  - ${u.name}: ${u.email}`);
  }
  // eslint-disable-next-line no-console
  console.log(
    `As demais ${createdUsers.length - loginableUsers.length} colaboradoras existem apenas como dado rastreado (autoria de conteúdo, acessos, reconhecimento) — sem papel e sem senha conhecida.`,
  );

  // ---- Volume de dados (idempotente: só gera se ainda não houver News) ----
  const existingNews = await prisma.news.count({ where: { tenantId: tenant.id } });
  if (existingNews > 0) {
    // eslint-disable-next-line no-console
    console.log('Volume de News/Beezz/LoginEvent/Pod/Reaction/AdmissionAward já existe — pulando geração.');
  } else {
    await seedVolumeData(tenant.id, createdUsers, company.id);
    // eslint-disable-next-line no-console
    console.log('Volume de dados de demonstração gerado (News, Beezz, LoginEvent, Pod, Reaction, AdmissionAward).');
  }
}

async function seedVolumeData(tenantId: string, users: { id: string; email: string; name: string }[], _companyId: string) {
  // ---- Devices ----
  const deviceDefs = [
    { sourceId: 'desktop-1', type: 'desktop', label: 'Desktop Corporativo' },
    { sourceId: 'mobile-1', type: 'mobile', label: 'App Mobile' },
    { sourceId: 'tablet-1', type: 'tablet', label: 'Tablet' },
  ];
  const devices: Device[] = [];
  for (const d of deviceDefs) {
    devices.push(
      await prisma.device.create({
        data: { tenantId, sourceId: d.sourceId, type: d.type, label: d.label },
      }),
    );
  }

  // ---- Pods ----
  const podDefs = [
    { name: 'Pod Boas-vindas', description: 'Onboarding de novas colaboradoras' },
    { name: 'Pod Comunicação Interna', description: 'Comunicados e novidades' },
    { name: 'Pod Bem-estar', description: 'Saúde e qualidade de vida' },
  ];
  const pods: Pod[] = [];
  for (const [idx, p] of podDefs.entries()) {
    pods.push(
      await prisma.pod.create({
        data: {
          tenantId,
          sourceId: `pod-${idx + 1}`,
          name: p.name,
          description: p.description,
          accessCount: randomInt(20, 200),
        },
      }),
    );
  }

  // ---- News (últimos 21 dias) ----
  const newsTitles = [
    'BeeHome Brasil lança novo canal de comunicação interna',
    'Resultados do trimestre são apresentados às equipes',
    'Nova política de trabalho híbrido entra em vigor',
    'Campanha de vacinação chega à sede',
    'Programa de mentoria abre inscrições',
    'Semana da diversidade tem programação especial',
    'Novo benefício de bem-estar é anunciado',
    'Equipe de Tecnologia lança portal de autoatendimento',
    'Comunicação divulga calendário de eventos do semestre',
    'RH apresenta pesquisa de clima organizacional',
  ];
  const newsList: News[] = [];
  for (const [idx, title] of newsTitles.entries()) {
    const author = users[idx % users.length];
    const views = randomInt(80, 900);
    const likes = randomInt(5, Math.min(120, views));
    const comments = randomInt(0, Math.min(40, likes));
    newsList.push(
      await prisma.news.create({
        data: {
          tenantId,
          sourceId: `news-${idx + 1}`,
          title,
          authorName: author.name,
          publishedAt: daysAgo(randomInt(0, 21), randomInt(7, 18)),
          views,
          likes,
          comments,
        },
      }),
    );
  }

  // ---- Beezz (últimos 21 dias) ----
  const beezzTitles = [
    'Bom dia, equipe! ☕',
    'Compartilhando uma conquista do time',
    'Foto do nosso último happy hour',
    'Dica rápida de produtividade',
    'Parabéns para quem completou aniversário de casa este mês',
    'Registro do workshop de ontem',
    'Reflexão sobre a semana',
    'Novidade chegando em breve...',
    'Agradecimento ao time de suporte',
    'Bastidores do projeto novo',
    'Momento de gratidão',
    'Compartilhando aprendizado do treinamento',
    'Nosso time cresceu esse mês!',
    'Resultado incrível da campanha',
    'Sexta-feira produtiva por aqui',
  ];
  const beezzList: Beezz[] = [];
  for (const [idx, title] of beezzTitles.entries()) {
    const author = users[idx % users.length];
    const likes = randomInt(2, 60);
    const comments = randomInt(0, Math.min(15, likes));
    beezzList.push(
      await prisma.beezz.create({
        data: {
          tenantId,
          sourceId: `beezz-${idx + 1}`,
          title,
          authorName: author.name,
          createdAt: daysAgo(randomInt(0, 21), randomInt(7, 20)),
          publishedAt: daysAgo(randomInt(0, 21), randomInt(7, 20)),
          likes,
          comments,
        },
      }),
    );
  }

  // ---- Reaction (snapshots ligados a news/beezz, últimos 21 dias) ----
  for (let i = 0; i < 18; i++) {
    const news = newsList[i % newsList.length];
    const beezz = beezzList[i % beezzList.length];
    const linkToNews = i % 2 === 0;
    await prisma.reaction.create({
      data: {
        tenantId,
        newsId: linkToNews ? news.id : null,
        beezzId: linkToNews ? null : beezz.id,
        countBeezzLiked: randomInt(0, 30),
        countCommentsBeezz: randomInt(0, 10),
        countBeezzCommentLike: randomInt(0, 8),
        countNewsLiked: randomInt(0, 40),
        countCommentsNews: randomInt(0, 12),
        countNewsCommentLike: randomInt(0, 8),
        countVideoLiked: randomInt(0, 15),
        countCommentsVideos: randomInt(0, 5),
        countPollLiked: randomInt(0, 10),
        countPhotobookLiked: randomInt(0, 10),
        countBlogLiked: randomInt(0, 10),
        countPodcastLiked: randomInt(0, 5),
        capturedAt: daysAgo(randomInt(0, 21), randomInt(7, 20)),
      },
    });
  }

  // ---- LoginEvent (últimos 14 dias, poucos eventos por usuária/dia) ----
  let loginSeq = 0;
  for (const user of users) {
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const loginsToday = randomInt(0, 2);
      for (let j = 0; j < loginsToday; j++) {
        loginSeq++;
        const device = devices[randomInt(0, devices.length - 1)];
        await prisma.loginEvent.create({
          data: {
            tenantId,
            sourceId: `login-${loginSeq}`,
            userSourceId: user.id,
            occurredAt: daysAgo(dayOffset, randomInt(7, 20), randomInt(0, 59)),
            deviceId: device.id,
          },
        });
      }
    }
  }

  // ---- AdmissionAward (mês atual e anterior) ----
  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1;
  const lastMonthYear = thisMonth === 1 ? thisYear - 1 : thisYear;

  for (const [idx, user] of users.slice(0, 3).entries()) {
    await prisma.admissionAward.create({
      data: { tenantId, sourceId: `admission-${idx + 1}`, userSourceId: user.id, month: thisMonth, year: thisYear },
    });
  }
  for (const [idx, user] of users.slice(3, 5).entries()) {
    await prisma.admissionAward.create({
      data: { tenantId, sourceId: `admission-prev-${idx + 1}`, userSourceId: user.id, month: lastMonth, year: lastMonthYear },
    });
  }

  // ---- AlertRule + Alert de exemplo ----
  const rule = await prisma.alertRule.create({
    data: {
      tenantId,
      name: 'Queda de acessos',
      metric: 'access.totalLogins',
      condition: 'queda > 15% em 7 dias',
      threshold: 15,
      severity: 'warning',
      active: true,
      createdBy: users[0]?.name,
    },
  });
  await prisma.alert.create({
    data: {
      tenantId,
      ruleId: rule.id,
      title: 'Possível queda de acessos detectada',
      description: 'O total de acessos da última semana ficou abaixo do limite configurado na regra "Queda de acessos".',
      severity: 'warning',
      status: 'novo',
      metric: 'access.totalLogins',
    },
  });

  // ---- SyncJob de exemplo (sincronização já concluída) ----
  await prisma.syncJob.create({
    data: {
      tenantId,
      source: 'Intranet BeeHome',
      status: 'sucesso',
      startedAt: daysAgo(0, 6, 0),
      finishedAt: daysAgo(0, 6, 4),
      recordsProcessed: newsList.length + beezzList.length + loginSeq + pods.length,
      triggeredBy: 'manual',
    },
  });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
