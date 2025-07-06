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

// ---------------------------------------------
// 1. Build an Express app that works for both:
//    • Vercel Serverless Functions (exported handler)
//    • Local development (`npm run dev` / `npm start`)
// ---------------------------------------------

async function initServer() {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(bodyParser.json());
  
  // API endpoints
  app.post('/api/generate-quiz', async (req, res) => {
    await generateQuizHandler(req, res);
  });
  
  if (isProduction) {
    // Serve the compiled frontend
    const staticDir = path.resolve(__dirname, 'dist');
    app.use(express.static(staticDir));
    
    // SPA fallback – always return index.html
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  } else {
    // Development: use Vite dev server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }
  
  return app;
}

// ---------------------------------------------
// 2. Vercel Serverless Function export
// ---------------------------------------------

let vercelApp; // cached between invocations

export default async function handler(req, res) {
  if (!vercelApp) {
    vercelApp = await initServer();
  }
  return vercelApp(req, res);
}

// ---------------------------------------------
// 3. Local development / traditional server
// ---------------------------------------------

if (!process.env.VERCEL) {
  initServer()
    .then((app) => {
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Error starting server:', err);
    });
} 