#!/usr/bin/env node

/**
 * PostPulse.io Local Development Setup
 * Automates the setup and testing of local development environment
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('🚀 PostPulse.io Local Development Setup\n');

// Check if .env exists
const envPath = path.join(rootDir, '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found. Copying from .env.example...');
  execSync(`cp .env.example .env`, { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ Created .env file. Please edit it with your credentials.\n');
}

// Check Node.js version
const nodeVersion = process.version;
const minVersion = '18.0.0';
if (nodeVersion < minVersion) {
  console.error(`❌ Node.js ${minVersion} or higher required. Current: ${nodeVersion}`);
  process.exit(1);
}
console.log(`✅ Node.js version: ${nodeVersion}`);

// Install dependencies
console.log('📦 Installing root dependencies...');
try {
  execSync('npm install', { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ Root dependencies installed');
} catch (error) {
  console.error('❌ Failed to install root dependencies:', error.message);
  process.exit(1);
}

// Install frontend dependencies
console.log('📦 Installing frontend dependencies...');
const frontendDir = path.join(rootDir, 'frontend');
try {
  execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
  console.log('✅ Frontend dependencies installed');
} catch (error) {
  console.error('❌ Failed to install frontend dependencies:', error.message);
  process.exit(1);
}

// Validate environment
console.log('🔍 Validating environment...');
try {
  execSync('node scripts/validate-env.js', { cwd: rootDir, stdio: 'inherit' });
} catch (error) {
  console.log('⚠️  Environment validation failed. Please check your .env file.');
  console.log('   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ENCRYPTION_KEY\n');
}

// Check database connectivity
console.log('🗄️  Checking database connectivity...');
try {
  // This would require the validate-env script to be enhanced
  console.log('⚠️  Database connectivity check requires manual verification');
  console.log('   Visit: https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
  console.log('   Run: SELECT version();\n');
} catch (error) {
  console.log('⚠️  Database check failed. Ensure Supabase credentials are correct.');
}

// Start development servers
console.log('🚀 Starting development servers...\n');

const startServers = () => {
  console.log('🌐 Frontend: http://localhost:3001');
  console.log('🔧 Backend API: http://localhost:3000');
  console.log('📊 Health Check: http://localhost:3001/api/health\n');

  console.log('Available commands:');
  console.log('• Ctrl+C to stop all servers');
  console.log('• Open browser to http://localhost:3001');
  console.log('• Check API docs at /api/health\n');

  // Start backend server
  const backendProcess = spawn('npm', ['run', 'dev'], {
    cwd: rootDir,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true
  });

  backendProcess.stdout.on('data', (data) => {
    if (data.toString().includes('Server running')) {
      console.log('✅ Backend server started successfully');
    }
  });

  backendProcess.stderr.on('data', (data) => {
    console.error('Backend error:', data.toString());
  });

  // Start frontend server
  const frontendProcess = spawn('npm', ['run', 'dev:frontend'], {
    cwd: rootDir,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true
  });

  frontendProcess.stdout.on('data', (data) => {
    if (data.toString().includes('Ready')) {
      console.log('✅ Frontend server started successfully');
    }
  });

  frontendProcess.stderr.on('data', (data) => {
    console.error('Frontend error:', data.toString());
  });

  // Handle shutdown
  const shutdown = () => {
    console.log('\n🛑 Shutting down servers...');
    backendProcess.kill();
    frontendProcess.kill();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

// Give user option to start servers
console.log('🎯 Setup complete! Ready to start development servers?');
console.log('This will start both frontend (Next.js) and backend (MCP server)');
console.log('Press Enter to continue, or Ctrl+C to exit...\n');

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', (key) => {
  if (key[0] === 3) { // Ctrl+C
    console.log('\n👋 Exiting...');
    process.exit(0);
  } else if (key[0] === 13) { // Enter
    process.stdin.setRawMode(false);
    process.stdin.pause();
    startServers();
  }
});

// Export for programmatic use
export { startServers };
