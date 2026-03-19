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
	if (!body?.productName) {
		throw error(400, 'Missing productName');
	}

	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

	const prompt = `Recherchiere EU-DPP-relevante Informationen für folgendes Produkt:
Produkt: ${body.productName}
Hersteller: ${body.manufacturer ?? 'Unbekannt'}

Analysiere und berichte über:
1. Typische Materialzusammensetzung dieser Produktkategorie
2. Verfügbare Nachhaltigkeitszertifizierungen für diese Kategorie
3. Spezifische EU-Konformitätsanforderungen (ESPR, Batterieverordnung, WEEE, REACH)
4. Branchenstandards für DPP-Datenpunkte
5. Reparierbarkeitsanforderungen nach EU-Methodik
6. Empfehlungen für Verbesserungen

Erstelle einen praxisorientierten Bericht auf Deutsch.`;

	const result = await model.generateContent(prompt);
	return json({ text: result.response.text() });
};
