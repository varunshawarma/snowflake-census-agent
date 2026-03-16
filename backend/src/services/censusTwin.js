import { generateCensusResponse } from './anthropic.js';

export async function processQuery(query, conversationHistory = []) {
  const { answer, sqlQueries } = await generateCensusResponse({
    query,
    conversationHistory,
  });

  return {
    answer,
    sources: sqlQueries.map(sql => ({
      type: 'sql',
      snippet: sql.length > 120 ? sql.substring(0, 120) + '...' : sql,
      relevanceScore: 1.0,
    })),
    confidence: 1.0,
  };
}
