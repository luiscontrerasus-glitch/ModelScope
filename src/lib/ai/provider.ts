// Imported only by server routes. No browser module imports this file.
import { GoogleGenAI } from '@google/genai';
export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const FREE_MODELS = new Set([DEFAULT_MODEL, 'gemini-3.1-flash-lite']);
export interface ProviderRequest { instruction: string; data: unknown; schema: Record<string, unknown>; signal: AbortSignal }
export type Provider = (request: ProviderRequest) => Promise<string>;
export class AIUnavailable extends Error {}
export function configuredProvider(): Provider {
  const key = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  // A model's free tier does not establish an API project's billing status.
  if (!key || process.env.GEMINI_FREE_TIER_CONFIRMED !== 'true' || !FREE_MODELS.has(model)) throw new AIUnavailable();
  return async ({ instruction, data, schema, signal }) => {
    const ai = new GoogleGenAI({ apiKey: key, vertexai: false, httpOptions: { timeout: 15000, retryOptions: { attempts: 1 } } });
    const response = await ai.models.generateContent({ model, contents: JSON.stringify({ untrustedData: data }), config: {
      systemInstruction: instruction, responseMimeType: 'application/json', responseJsonSchema: schema,
      maxOutputTokens: 1600, temperature: 0, abortSignal: signal,
      // No grounding, tools, file uploads, caching or automatic retry.
    } });
    if (!response.text || response.text.length > 12000) throw new Error('Invalid provider output');
    return response.text;
  };
}
