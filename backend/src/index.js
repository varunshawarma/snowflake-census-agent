import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeAgent, getCachedPrompt } from './services/anthropic.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS - allow both local and Railway frontend
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    process.env.FRONTEND_URL,        // Railway frontend URL
  ].filter(Boolean)
}));
app.use(express.json());

// API Routes
app.use('/api/chat', chatRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Consensus Agent is running' });
});

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  
  // Catch-all: serve index.html for any non-API route
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  try {
    await initializeAgent();
  } catch (err) {
    console.error('Failed to initialize agent:', err);
  }
});

app.get('/prompt', (req, res) => {
  res.type('text/plain').send(getCachedPrompt() || 'Not loaded yet');
});