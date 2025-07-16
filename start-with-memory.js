#!/usr/bin/env node

/**
 * This script starts the Next.js application with increased memory limits
 * to prevent "JavaScript heap out of memory" errors.
 */

const { spawn } = require('child_process');
const path = require('path');

// Set memory limit to 4GB
process.env.NODE_OPTIONS = '--max-old-space-size=4096';

// Determine the command to run based on the environment
const isDev = process.env.NODE_ENV !== 'production';
const command = isDev ? 'next dev' : 'next start';

console.log(`Starting Next.js with increased memory limit (4GB)`);
console.log(`Running command: ${command}`);

// Spawn the Next.js process
const nextProcess = spawn('npx', command.split(' '), {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: '--max-old-space-size=4096'
  }
});

// Handle process events
nextProcess.on('close', (code) => {
  console.log(`Next.js process exited with code ${code}`);
  process.exit(code);
});

nextProcess.on('error', (err) => {
  console.error('Failed to start Next.js process:', err);
  process.exit(1);
});

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down Next.js process...');
  nextProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down Next.js process...');
  nextProcess.kill('SIGTERM');
});