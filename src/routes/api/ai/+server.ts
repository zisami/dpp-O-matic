import { json, error } from '@sveltejs/kit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const SYSTEM_INSTRUCTION = `Du bist ein Experte für den digitalen EU-Produktpass (DPP) und EU-Nachhaltigkeitsvorschriften. 
Du hilfst Unternehmen, ihre Produkte für den DPP vorzubereiten, EU-Konformität zu prüfen und Nachhaltigkeitsdaten zu erfassen.
Beantworte Fragen auf Deutsch oder in der Sprache des Nutzers.
Fokussiere auf: EU-Ökodesign-Verordnung (ESPR), Batterieverordnung, WEEE, REACH, Lieferkettentransparenz, Kreislaufwirtschaft.
Gib konkrete, umsetzbare Empfehlungen mit klarer Struktur.`;

export const POST: RequestHandler = async ({ request }) => {
	const apiKey = env.VITE_GEMINI_API_KEY ?? env.GEMINI_API_KEY ?? '';
	if (!apiKey) {
		throw error(500, 'GEMINI_API_KEY not configured');
	}

	const body = await request.json().catch(() => null);
	if (!body?.message) {
		throw error(400, 'Missing message');
	}

	const { message, history = [] } = body as {
		message: string;
		history: { role: string; content: string }[];
	};

	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({
		model: 'gemini-1.5-flash',
		systemInstruction: SYSTEM_INSTRUCTION
	});

	const chatHistory = history.map((msg: { role: string; content: string }) => ({
		role: msg.role === 'user' ? 'user' : 'model',
		parts: [{ text: msg.content }]
	}));

	const chat = model.startChat({ history: chatHistory });
	const result = await chat.sendMessage(message);
	const text = result.response.text();

	return json({ text });
};
