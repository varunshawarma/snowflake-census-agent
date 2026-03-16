import express from 'express';
import { processQuery } from '../services/censusTwin.js';

const router = express.Router();

// POST /api/chat - Main endpoint for querying the census twin
router.post('/', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Process the query through the census twin service
    const response = await processQuery(message, conversationHistory);

    res.json({
      response: response.answer,
      sources: response.sources,
      confidence: response.confidence
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

export default router;
