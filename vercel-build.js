#!/usr/bin/env node

// This script is used by Vercel to build the project without using native Rollup modules

console.log('Setting up Vercel build environment...');

// Force disable Rollup native modules
process.env.ROLLUP_NATIVE_MODULES = 'no';

// Continue with the regular build process
import { spawnSync } from 'child_process';
console.log('Running Vite build...');

const result = spawnSync('npx', ['vite', 'build'], { 
  stdio: 'inherit',
  env: {
    ...process.env,
    ROLLUP_NATIVE_MODULES: 'no'
  }
});

// Exit with the same code as the build process
process.exit(result.status || 0); 