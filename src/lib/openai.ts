// src/lib/openai.ts
import OpenAI from 'openai';
import { wrapOpenAI } from 'langsmith/wrappers';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

// Validate LangSmith configuration (optional but recommended)
if (process.env.LANGSMITH_TRACING === 'true' && !process.env.LANGSMITH_API_KEY) {
  console.warn('⚠️  LANGSMITH_TRACING is enabled but LANGSMITH_API_KEY is missing. Tracing will not work.');
}

// Create base OpenAI client
const baseClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Wrap with LangSmith tracing for automatic observability
export const openai = wrapOpenAI(baseClient);

export const AI_CONFIG = {
  model: 'gpt-4o-2024-08-06', // Supports structured outputs
  maxTokens: 4000,
  temperature: 0.1, // Low temperature for consistent parameter extraction
  streamingModel: 'gpt-4o-2024-08-06',
} as const;

export type AIModel = typeof AI_CONFIG.model;