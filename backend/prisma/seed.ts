/**
 * Seed mínimo de desenvolvimento:
 *  - Catálogo de Permission (as 20 chaves fixas do sistema).
 *  - Um tenant de demonstração com os 3 papéis padrão (administradora,
 *    gestao-comunicacao, colaborador) e um usuário administrador.
 *
 * Executar com: npx prisma db seed (requer DATABASE_URL apontando para um
 * Postgres real — não roda neste sandbox sem banco disponível).
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PERMISSION_KEYS, PERMISSION_DESCRIPTIONS, DEFAULT_ROLES } from '../src/auth/permissions.constants';

const prisma = new PrismaClient();

async function main() {
  for (const key of PERMISSION_KEYS) {
    await prisma.permission.upsert({
      where: { key },
      update: { description: PERMISSION_DESCRIPTIONS[key] },
      create: { key, description: PERMISSION_DESCRIPTIONS[key] },
    });
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: { name: 'Tenant Demo', slug: 'demo' },
  });

  for (const roleDef of DEFAULT_ROLES) {
    const role = await prisma.role.upsert({
      where: { tenantId_key: { tenantId: tenant.id, key: roleDef.key } },
      update: { name: roleDef.name, description: roleDef.description },
      create: { tenantId: tenant.id, key: roleDef.key, name: roleDef.name, description: roleDef.description },
    });

    const permissions = await prisma.permission.findMany({ where: { key: { in: roleDef.permissions } } });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissions.map((p) => ({ tenantId: tenant.id, roleId: role.id, permissionId: p.id })),
      });
    }
  }

  const adminRole = await prisma.role.findFirst({ where: { tenantId: tenant.id, key: 'administradora' } });
  const passwordHash = await bcrypt.hash('troque-esta-senha', 10);

  const adminUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@demo.local' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Administradora Demo', email: 'admin@demo.local', passwordHash, active: true },
  });

  if (adminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
      update: {},
      create: { tenantId: tenant.id, userId: adminUser.id, roleId: adminRole.id },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seed concluído. Tenant slug: "demo". Login: admin@demo.local / troque-esta-senha`);
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
