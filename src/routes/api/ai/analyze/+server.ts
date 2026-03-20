import { json, error } from '@sveltejs/kit';
import { getAIClient, AI_MODEL } from '$lib/ai.server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	let client;
	try {
		client = getAIClient();
	} catch {
		throw error(500, 'REQUESTY_API_KEY not configured');
	}

	const body = await request.json().catch(() => null);
	if (!body?.productData) {
		throw error(400, 'Missing productData');
	}

	const prompt = `Analysiere folgende Produktdaten für die EU-DPP-Konformität:

${body.productData}

Erstelle eine strukturierte Analyse mit:
1. EU-Konformitätsstatus (Ökodesign/ESPR, Batterieverordnung, WEEE, REACH)
2. Nachhaltigkeitsbewertung (0-100 Punkte)
3. Fehlende oder unvollständige DPP-Informationen
4. Konkrete Verbesserungsempfehlungen
5. Prioritäten nach Dringlichkeit (Hoch/Mittel/Niedrig)

Antworte auf Deutsch mit klarer Struktur und Überschriften.`;

	const completion = await client.chat.completions.create({
		model: AI_MODEL,
		messages: [{ role: 'user', content: prompt }]
	});

	return json({ text: completion.choices[0]?.message?.content ?? '' });
};
