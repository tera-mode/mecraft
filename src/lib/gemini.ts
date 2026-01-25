import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not defined');
}

const genAI = new GoogleGenerativeAI(apiKey);

// gemini-2.5-flashを使用（gemini-1.5シリーズは2025年4月に廃止済み）
export const getGeminiModel = (modelName: string = 'gemini-2.5-flash') => {
  return genAI.getGenerativeModel({ model: modelName });
};

export { genAI };
