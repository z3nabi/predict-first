import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

// Load environment variables
dotenv.config();

async function checkEnv() {
  console.log('Environment check:');
  console.log('------------------');
  console.log('CLAUDE_API_KEY:', process.env.CLAUDE_API_KEY ? 'Defined' : 'Not defined');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Current working directory:', process.cwd());
  
  try {
    // Check if .env file exists
    const envPath = path.join(process.cwd(), '.env');
    await fs.access(envPath);
    console.log('.env file exists at:', envPath);
    
    // Read first line of .env file (without showing API key)
    const envContent = await fs.readFile(envPath, 'utf8');
    const lines = envContent.split('\n');
    console.log('First line of .env file contains CLAUDE_API_KEY:', lines[0].startsWith('CLAUDE_API_KEY='));
    console.log('Total lines in .env file:', lines.length);
  } catch (error) {
    console.log('.env file does not exist or is not accessible');
  }
}

checkEnv(); 