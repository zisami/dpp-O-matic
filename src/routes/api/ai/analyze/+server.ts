import { json, error } from '@sveltejs/kit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const apiKey = env.VITE_GEMINI_API_KEY ?? env.GEMINI_API_KEY ?? '';
	if (!apiKey) {
		throw error(500, 'GEMINI_API_KEY not configured');
	}

	const body = await request.json().catch(() => null);
	if (!body?.productData) {
		throw error(400, 'Missing productData');
	}

	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

	const prompt = `Analysiere folgende Produktdaten für die EU-DPP-Konformität:

${body.productData}

Erstelle eine strukturierte Analyse mit:
1. EU-Konformitätsstatus (Ökodesign/ESPR, Batterieverordnung, WEEE, REACH)
2. Nachhaltigkeitsbewertung (0-100 Punkte)
3. Fehlende oder unvollständige DPP-Informationen
4. Konkrete Verbesserungsempfehlungen
5. Prioritäten nach Dringlichkeit (Hoch/Mittel/Niedrig)

Antworte auf Deutsch mit klarer Struktur und Überschriften.`;

	const result = await model.generateContent(prompt);
	return json({ text: result.response.text() });
};
