import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not defined');
}

const genAI = new GoogleGenerativeAI(apiKey);

export const getGeminiModel = (modelName: string = 'gemini-2.0-flash-exp') => {
  return genAI.getGenerativeModel({ model: modelName });
};

export { genAI };
