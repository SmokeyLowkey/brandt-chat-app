import { PrismaClient } from '../lib/generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Get tenant details from environment variables or use defaults
  const tenantName = process.env.SEED_TENANT_NAME || 'Brandt Group of Companies';
  const tenantSlug = process.env.SEED_TENANT_SLUG || 'brandt';
  const tenantDomain = process.env.SEED_TENANT_DOMAIN || 'brandt.com';
  
  // Create tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    update: {},
    create: {
      name: tenantName,
      slug: tenantSlug,
      domain: tenantDomain,
      settings: {
        theme: 'light',
        features: {
          documentUpload: true,
          analytics: true,
        },
      },
    },
  });

  console.log(`Created tenant: ${tenant.name}`);

  // Get admin credentials from environment variables or use defaults
  const rootAdminEmail = process.env.SEED_ROOT_ADMIN_EMAIL || 'admin@brandt.com';
  const rootAdminName = process.env.SEED_ROOT_ADMIN_NAME || 'System Administrator';
  
  // In production, require a secure password from environment variables
  // In development, use a default password
  let rootAdminPassword;
  if (isProduction) {
    if (!process.env.SEED_ROOT_ADMIN_PASSWORD) {
      console.warn('WARNING: No SEED_ROOT_ADMIN_PASSWORD provided in production environment.');
      console.warn('Please set this environment variable to create a secure root admin user.');
      rootAdminPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 12);
      console.warn('A random password has been generated. You will need to reset it.');
    } else {
      rootAdminPassword = await bcrypt.hash(process.env.SEED_ROOT_ADMIN_PASSWORD, 12);
    }
  } else {
    // Use a simple password for development
    rootAdminPassword = await bcrypt.hash('password123', 12);
  }

  // Create root admin user
  const rootAdmin = await prisma.user.upsert({
    where: { email: rootAdminEmail },
    update: {},
    create: {
      name: rootAdminName,
      email: rootAdminEmail,
      password: rootAdminPassword,
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });

  console.log(`Created root admin user: ${rootAdmin.email}`);

  // Only create demo users in development environment
  if (!isProduction) {
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
        tenantId: tenant.id,
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
        tenantId: tenant.id,
      },
    });

    console.log(`Created support agent: ${agentUser.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });