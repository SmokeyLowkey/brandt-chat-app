/**
 * Setup Production Admin Script
 * 
 * This script simulates setting up the admin user for production deployment.
 * It sets the necessary environment variables and runs the Prisma seed script.
 * 
 * Usage:
 * node setup-production-admin.js
 */

const { exec } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setupProductionAdmin() {
  console.log('\n=== Production Admin Setup ===\n');
  
  // Get tenant information
  const tenantName = await prompt('Enter tenant name (e.g., "Brandt Group of Companies"): ');
  const tenantSlug = await prompt('Enter tenant slug (e.g., "brandt"): ');
  const tenantDomain = await prompt('Enter tenant domain (e.g., "brandt.com"): ');
  
  // Get admin information
  const adminEmail = await prompt('Enter admin email: ');
  const adminName = await prompt('Enter admin name: ');
  const adminPassword = await prompt('Enter secure admin password: ');
  
  console.log('\nSetting up production admin with the following details:');
  console.log(`- Tenant: ${tenantName} (${tenantSlug}.${tenantDomain})`);
  console.log(`- Admin: ${adminName} (${adminEmail})`);
  console.log('- Password: [HIDDEN]\n');
  
  const confirm = await prompt('Proceed with setup? (y/n): ');
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('Setup cancelled.');
    rl.close();
    return;
  }
  
  // Set environment variables for the seed script
  const env = {
    ...process.env,
    NODE_ENV: 'production',
    SEED_TENANT_NAME: tenantName,
    SEED_TENANT_SLUG: tenantSlug,
    SEED_TENANT_DOMAIN: tenantDomain,
    SEED_ROOT_ADMIN_EMAIL: adminEmail,
    SEED_ROOT_ADMIN_NAME: adminName,
    SEED_ROOT_ADMIN_PASSWORD: adminPassword
  };
  
  console.log('\nRunning seed script with production environment...');
  
  // Run the Prisma seed command using exec instead of spawn
  const command = 'npx prisma db seed';
  
  const seedProcess = exec(command, { env }, (error, stdout, stderr) => {
    if (error) {
      console.error(`\nSeed script failed: ${error.message}`);
      rl.close();
      return;
    }
    
    if (stderr) {
      console.error(`\nSeed script stderr: ${stderr}`);
    }
    
    console.log(stdout);
    
    console.log('\n=== Production Admin Setup Complete ===');
    console.log('\nImportant: For actual production deployment, set these environment variables in your hosting platform:');
    console.log('- NODE_ENV=production');
    console.log(`- SEED_TENANT_NAME="${tenantName}"`);
    console.log(`- SEED_TENANT_SLUG="${tenantSlug}"`);
    console.log(`- SEED_TENANT_DOMAIN="${tenantDomain}"`);
    console.log(`- SEED_ROOT_ADMIN_EMAIL="${adminEmail}"`);
    console.log(`- SEED_ROOT_ADMIN_NAME="${adminName}"`);
    console.log(`- SEED_ROOT_ADMIN_PASSWORD="[your-secure-password]"`);
    
    console.log('\nFor Vercel deployment, add these to your project environment variables.');
    
    rl.close();
  });
  
  // Display output in real-time
  if (seedProcess.stdout) {
    seedProcess.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
  }
  
  if (seedProcess.stderr) {
    seedProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  }
}

setupProductionAdmin().catch(err => {
  console.error('Error during setup:', err);
  rl.close();
});