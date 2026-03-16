import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat.js';
import { initializeAgent, getCachedPrompt } from './services/anthropic.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.use(express.json());

app.use('/api/chat', chatRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Census Agent is running' });
});

app.get('/prompt', (req, res) => {
  res.type('text/plain').send(getCachedPrompt() || 'Not loaded yet');
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  try {
    await initializeAgent();
  } catch (err) {
    console.error('Failed to initialize agent:', err);
  }
});