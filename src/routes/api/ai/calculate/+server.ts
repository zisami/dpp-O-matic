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

	const prompt = `Berechne einen DPP-Konformitätsscore für folgende Produktdaten:

${JSON.stringify(body.productData, null, 2)}

Bewerte folgende Dimensionen (je 0-100 Punkte):
- Nachhaltigkeitsscore: Materialien, Energieeffizienz, CO₂-Emissionen
- Zirkuläritätsscore: Recyclingfähigkeit, Wiederverwendbarkeit, Reparierbarkeit
- Transparenzscore: Datenvollständigkeit, Rückverfolgbarkeit der Lieferkette
- Reparierbarkeitsindex: nach EU-Methodik (1-10 Skala → als Score 0-100)

Gesamtscore = gewichteter Durchschnitt (Nachhaltigkeit 30%, Zirkularität 30%, Transparenz 20%, Reparierbarkeit 20%)

WICHTIG: Antworte NUR mit einem validen JSON-Objekt, kein Markdown, keine Erklärungen außerhalb des JSON:
{
  "overallScore": <number 0-100>,
  "sustainabilityScore": <number 0-100>,
  "circularityScore": <number 0-100>,
  "transparencyScore": <number 0-100>,
  "repairabilityScore": <number 0-100>,
  "recommendations": ["<string>", "<string>", "<string>"],
  "euCompliance": {
    "ecodesign": <boolean>,
    "batteryRegulation": <boolean>,
    "wasteElectronics": <boolean>,
    "chemicalSafety": <boolean>,
    "supplyChain": <boolean>
  },
  "summary": "<kurze Zusammenfassung auf Deutsch>"
}`;

	const result = await model.generateContent(prompt);
	const text = result.response.text().trim();

	// Extract JSON: prefer the largest match to capture the full object
	const fullMatch = text.match(/\{[\s\S]*\}/)?.[0];
	if (!fullMatch) {
		return json({ raw: text, error: 'Could not parse JSON response' });
	}

	try {
		const parsed = JSON.parse(fullMatch);
		return json(parsed);
	} catch {
		return json({ raw: text, error: 'Invalid JSON response' });
	}
};
