import { PrismaClient } from '../lib/generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create demo tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'brandt' },
    update: {},
    create: {
      name: 'Brandt Group of Companies',
      slug: 'brandt',
      domain: 'brandt.com',
      settings: {
        theme: 'light',
        features: {
          documentUpload: true,
          analytics: true,
        },
      },
    },
  });

  console.log(`Created demo tenant: ${demoTenant.name}`);

  // Create admin user
  const adminPassword = await bcrypt.hash('password123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@brandt.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@brandt.com',
      password: adminPassword,
      role: 'ADMIN',
      tenantId: demoTenant.id,
    },
  });

  console.log(`Created admin user: ${adminUser.email}`);

  // Create manager user
  const managerPassword = await bcrypt.hash('password123', 12);
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@brandt.com' },
    update: {},
    create: {
      name: 'Manager User',
      email: 'manager@brandt.com',
      password: managerPassword,
      role: 'MANAGER',
      tenantId: demoTenant.id,
    },
  });

  console.log(`Created manager user: ${managerUser.email}`);

  // Create support agent
  const agentPassword = await bcrypt.hash('password123', 12);
  const agentUser = await prisma.user.upsert({
    where: { email: 'agent@brandt.com' },
    update: {},
    create: {
      name: 'Support Agent',
      email: 'agent@brandt.com',
      password: agentPassword,
      role: 'SUPPORT_AGENT',
      tenantId: demoTenant.id,
    },
  });

  console.log(`Created support agent: ${agentUser.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });