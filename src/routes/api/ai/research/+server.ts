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
	if (!body?.productName) {
		throw error(400, 'Missing productName');
	}

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

	const completion = await client.chat.completions.create({
		model: AI_MODEL,
		messages: [{ role: 'user', content: prompt }]
	});

	return json({ text: completion.choices[0]?.message?.content ?? '' });
};
