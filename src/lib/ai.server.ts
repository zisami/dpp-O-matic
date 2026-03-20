import OpenAI from 'openai';
import { env } from '$env/dynamic/private';

export function getAIClient(): OpenAI {
    const apiKey = env.REQUESTY_API_KEY ?? '';
    if (!apiKey) throw new Error('REQUESTY_API_KEY not configured');

    return new OpenAI({
        apiKey,
        baseURL: 'https://router.requesty.ai/v1'
    });
}

export const AI_MODEL = env.AI_MODEL ?? 'openai/gpt-4o-mini';
