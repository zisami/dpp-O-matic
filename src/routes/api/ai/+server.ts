import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getAIClient, AI_MODEL } from '$lib/ai.server';
import type { RequestHandler } from './$types';

const SYSTEM_INSTRUCTION = `Du bist ein Experte für den digitalen EU-Produktpass (DPP) und EU-Nachhaltigkeitsvorschriften. 
Du hilfst Unternehmen, ihre Produkte für den DPP vorzubereiten, EU-Konformität zu prüfen und Nachhaltigkeitsdaten zu erfassen.
Beantworte Fragen auf Deutsch oder in der Sprache des Nutzers.
Fokussiere auf: EU-Ökodesign-Verordnung (ESPR), Batterieverordnung, WEEE, REACH, Lieferkettentransparenz, Kreislaufwirtschaft.
Gib konkrete, umsetzbare Empfehlungen mit klarer Struktur.`;

export const POST: RequestHandler = async ({ request }) => {
	let client;
	try {
		client = getAIClient();
	} catch {
		throw error(500, 'REQUESTY_API_KEY not configured');
	}

	const body = await request.json().catch(() => null);
	if (!body?.message) {
		throw error(400, 'Missing message');
	}

	const { message, history = [] } = body as {
		message: string;
		history: { role: string; content: string }[];
	};

	const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
		{ role: 'system', content: SYSTEM_INSTRUCTION },
		...history.map((msg) => ({
			role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
			content: msg.content
		})),
		{ role: 'user', content: message }
	];

	const completion = await client.chat.completions.create({
		model: AI_MODEL,
		messages
	});

	const text = completion.choices[0]?.message?.content ?? '';
	return json({ text });
};
