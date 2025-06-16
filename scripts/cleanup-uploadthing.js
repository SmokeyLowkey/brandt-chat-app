/**
 * Cleanup script to remove UploadThing-related files and dependencies
 * 
 * This script:
 * 1. Removes UploadThing-related files
 * 2. Removes UploadThing dependencies from package.json
 * 
 * Usage: node scripts/cleanup-uploadthing.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to remove
const filesToRemove = [
  'app/api/uploadthing/route.ts',
  'app/api/uploadthing/core.ts',
  'app/api/uploadthing-webhook/route.ts',
  'app/api/tenants/[tenantId]/uploadthing/route.ts',
  'lib/uploadthing.ts',
  'utils/uploadthing.ts',
];

// Dependencies to remove
const dependenciesToRemove = [
  '@uploadthing/react',
  'uploadthing',
];

console.log('Starting UploadThing cleanup...');

// Remove files
console.log('\nRemoving UploadThing-related files:');
filesToRemove.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed: ${file}`);
    } else {
      console.log(`⚠️ File not found: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error removing ${file}:`, error.message);
  }
});

// Remove dependencies from package.json
console.log('\nRemoving UploadThing dependencies from package.json:');
try {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  let dependenciesRemoved = false;
  
  dependenciesToRemove.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      delete packageJson.dependencies[dep];
      console.log(`✅ Removed dependency: ${dep}`);
      dependenciesRemoved = true;
    } else {
      console.log(`⚠️ Dependency not found: ${dep}`);
    }
  });
  
  if (dependenciesRemoved) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json');
  }
} catch (error) {
  console.error('❌ Error updating package.json:', error.message);
}

console.log('\nUploadThing cleanup complete!');
console.log('\nTo complete the cleanup, run:');
console.log('yarn install');