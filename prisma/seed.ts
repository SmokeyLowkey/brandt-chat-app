import { PrismaClient } from '../lib/generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Generate a random password with the specified length
 * @param length Length of the password to generate
 * @returns A random password string
 */
function generateRandomPassword(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  return Array(length).fill(0).map(() => 
    chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

// SECURITY NOTICE:
// This seed file is used to initialize the database with default data.
// In production, all sensitive information (passwords, emails, etc.) should be
// provided via environment variables and never committed to the repository.
//
// Environment variables to set:
// - SEED_TENANT_NAME: Name of the default tenant
// - SEED_TENANT_SLUG: Slug for the default tenant
// - SEED_TENANT_DOMAIN: Domain for the default tenant
// - SEED_ROOT_ADMIN_EMAIL: Email for the root admin user
// - SEED_ROOT_ADMIN_NAME: Name for the root admin user
// - SEED_ROOT_ADMIN_PASSWORD: Password for the root admin user (required in production)
//
// For development environments, default values will be used if not provided.

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
  const rootAdminEmail = process.env.SEED_ROOT_ADMIN_EMAIL || 'admin@example.com';
  const rootAdminName = process.env.SEED_ROOT_ADMIN_NAME || 'System Administrator';
  
  // In production, require a secure password from environment variables
  // In development, use a randomly generated password if not provided
  let rootAdminPassword;
  let plainTextPassword = '';
  
  if (isProduction) {
    if (!process.env.SEED_ROOT_ADMIN_PASSWORD) {
      console.error('ERROR: SEED_ROOT_ADMIN_PASSWORD is required in production environment.');
      console.error('Please set this environment variable to create a secure root admin user.');
      process.exit(1);
    } else {
      plainTextPassword = process.env.SEED_ROOT_ADMIN_PASSWORD;
      rootAdminPassword = await bcrypt.hash(plainTextPassword, 12);
    }
  } else {
    // For development, use environment variable if provided, otherwise generate a random password
    if (process.env.SEED_ROOT_ADMIN_PASSWORD) {
      plainTextPassword = process.env.SEED_ROOT_ADMIN_PASSWORD;
    } else {
      // Generate a random password for development
      plainTextPassword = generateRandomPassword(12);
    }
    
    rootAdminPassword = await bcrypt.hash(plainTextPassword, 12);
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
  
  if (!isProduction) {
    // In development, display the generated password for convenience
    console.log('------------------------------------------------------------');
    console.log('DEVELOPMENT ENVIRONMENT: Admin credentials for local testing');
    console.log(`Email: ${rootAdminEmail}`);
    console.log(`Password: ${plainTextPassword}`);
    console.log('------------------------------------------------------------');
    console.log('IMPORTANT: These credentials are for local development only.');
    console.log('In production, set secure credentials via environment variables.');
    console.log('------------------------------------------------------------');
  }

  // Only create demo users in development environment
  if (!isProduction) {
    // Create demo users with random passwords
    const demoUsers = [
      { email: 'manager@example.com', name: 'Manager User', role: 'MANAGER' },
      { email: 'agent@example.com', name: 'Support Agent', role: 'SUPPORT_AGENT' }
    ];
    
    for (const demoUser of demoUsers) {
      // Generate a random password
      const demoPassword = generateRandomPassword(10);
      
      const hashedPassword = await bcrypt.hash(demoPassword, 12);
      
      const user = await prisma.user.upsert({
        where: { email: demoUser.email },
        update: {},
        create: {
          name: demoUser.name,
          email: demoUser.email,
          password: hashedPassword,
          role: demoUser.role as any,
          tenantId: tenant.id,
        },
      });
      
      console.log(`Created ${demoUser.role.toLowerCase()} user: ${user.email} (Password: ${demoPassword})`);
    }
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