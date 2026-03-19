export interface ChatMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	timestamp: Date;
}

export interface DppProduct {
	id?: string;
	name: string;
	category: string;
	manufacturer: string;
	model: string;
	serialNumber: string;
	materials: Material[];
	sustainability: SustainabilityData;
	certifications: string[];
	files: string[];
	created?: string;
	updated?: string;
}

export interface Material {
	name: string;
	percentage: number;
	recyclable: boolean;
	origin: string;
}

export interface SustainabilityData {
	carbonFootprint: number;
	energyConsumption: number;
	waterUsage: number;
	repairabilityScore: number;
	durabilityYears: number;
	recycledContent: number;
}

export interface DppCalculationResult {
	overallScore: number;
	sustainabilityScore: number;
	circularityScore: number;
	transparencyScore: number;
	repairabilityScore: number;
	recommendations: string[];
	euCompliance: EuComplianceStatus;
}

export interface EuComplianceStatus {
	ecodesign: boolean;
	batteryRegulation: boolean;
	wasteElectronics: boolean;
	chemicalSafety: boolean;
	supplyChain: boolean;
}

export interface SearchResult {
	title: string;
	url: string;
	snippet: string;
}

export interface AiResponse {
	text: string;
	sources?: SearchResult[];
}
