import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import generateQuizHandler from './api/generate-quiz.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

async function createServer() {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(bodyParser.json());
  
  // API endpoints
  app.post('/api/generate-quiz', async (req, res) => {
    await generateQuizHandler(req, res);
  });
  
  // In production, serve the built files
  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    
    // Handle client-side routing
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // In development, create a Vite server
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    
    // Use Vite's connect instance as middleware
    app.use(vite.middlewares);
  }
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Error starting server:', err);
}); 