<script lang="ts">
	import type { DppCalculationResult } from '$lib/types';

	let calculating = $state(false);
	let result = $state<DppCalculationResult | null>(null);
	let rawResult = $state('');
	let error = $state('');

	// Calculator inputs
	let productName = $state('');
	let category = $state('Elektronik');
	let recycledContent = $state(0);
	let repairabilityScore = $state(5);
	let carbonFootprint = $state(0);
	let energyConsumption = $state(0);
	let durabilityYears = $state(5);
	let hasSupplyChainData = $state(false);
	let hasCertifications = $state(false);
	let recyclable = $state(false);
	let repairInstructions = $state(false);
	let spareParts = $state(false);

	const categories = [
		'Elektronik', 'Haushaltsgeräte', 'Textilien', 'Möbel', 'Fahrzeuge',
		'Batterien', 'Verpackungen', 'Baumaterialien', 'Spielzeug', 'Sonstiges'
	];

	// Local score calculation (no API needed)
	function calculateLocalScore() {
		const sustainability = Math.min(100, Math.max(0,
			(recycledContent * 0.4) +
			(Math.max(0, 100 - carbonFootprint * 0.1) * 0.3) +
			(Math.max(0, 100 - energyConsumption * 0.05) * 0.3)
		));

		const circularity = Math.min(100, Math.max(0,
			(recycledContent * 0.3) +
			(recyclable ? 30 : 0) +
			(repairabilityScore * 4) +
			(spareParts ? 10 : 0)
		));

		const transparency = Math.min(100, Math.max(0,
			(hasSupplyChainData ? 40 : 0) +
			(hasCertifications ? 30 : 0) +
			(repairInstructions ? 30 : 0)
		));

		const repairability = Math.min(100, Math.max(0, repairabilityScore * 10));

		const overall = Math.round(
			sustainability * 0.3 +
			circularity * 0.3 +
			transparency * 0.2 +
			repairability * 0.2
		);

		const recommendations: string[] = [];
		if (recycledContent < 20) recommendations.push('Erhöhen Sie den Recyclinganteil auf mindestens 20%');
		if (repairabilityScore < 6) recommendations.push('Verbessern Sie den Reparierbarkeitsindex (Ziel: ≥6/10)');
		if (!hasSupplyChainData) recommendations.push('Erfassen Sie Lieferkettendaten für mehr Transparenz');
		if (!hasCertifications) recommendations.push('Holen Sie EU-Zertifizierungen ein (EU Ecolabel, Energy Star)');
		if (carbonFootprint > 100) recommendations.push('Reduzieren Sie den CO₂-Fußabdruck (Ziel: <100 kg CO₂e)');
		if (durabilityYears < 5) recommendations.push('Verbessern Sie die Produktlebensdauer auf mind. 5 Jahre');

		result = {
			overallScore: overall,
			sustainabilityScore: Math.round(sustainability),
			circularityScore: Math.round(circularity),
			transparencyScore: Math.round(transparency),
			repairabilityScore: Math.round(repairability),
			recommendations,
			euCompliance: {
				ecodesign: overall >= 60,
				batteryRegulation: recycledContent >= 10,
				wasteElectronics: recyclable,
				chemicalSafety: hasCertifications,
				supplyChain: hasSupplyChainData
			}
		};
	}

	async function calculateWithAI() {
		if (!productName) {
			error = 'Bitte Produktname eingeben.';
			return;
		}
		calculating = true;
		error = '';
		result = null;
		rawResult = '';

		try {
			const productData = {
				name: productName,
				category,
				sustainability: {
					recycledContent,
					repairabilityScore,
					carbonFootprint,
					energyConsumption,
					durabilityYears
				},
				features: {
					hasSupplyChainData,
					hasCertifications,
					recyclable,
					repairInstructions,
					spareParts
				}
			};

			const response = await fetch('/api/ai/calculate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ productData })
			});

			const data = await response.json();
			if (data.error) {
				rawResult = data.raw ?? 'Unbekannter Fehler';
				calculateLocalScore();
			} else {
				result = data as DppCalculationResult;
			}
		} catch (err) {
			error = 'KI nicht verfügbar. Lokale Berechnung wird verwendet.';
			calculateLocalScore();
		} finally {
			calculating = false;
		}
	}

	function getScoreColor(score: number): string {
		if (score >= 75) return '#48bb78';
		if (score >= 50) return '#ed8936';
		return '#fc8181';
	}

	function getScoreLabel(score: number): string {
		if (score >= 75) return 'Gut';
		if (score >= 50) return 'Mittel';
		return 'Verbesserungsbedarf';
	}
</script>

<svelte:head>
	<title>DPP Kalkulator – DPP-O-Matic</title>
</svelte:head>

<div class="calculator-page">
	<div class="calc-layout">
		<div class="input-panel">
			<div class="panel-header">
				<h2>🧮 DPP Score Kalkulator</h2>
				<p>Berechnen Sie den Nachhaltigkeitsscore Ihres Produkts</p>
			</div>

			{#if error}
				<div class="alert alert-error">{error}</div>
			{/if}

			<div class="input-section">
				<h3>Produktdaten</h3>
				<div class="form-group">
					<label for="pname">Produktname</label>
					<input id="pname" type="text" bind:value={productName} placeholder="z.B. Notebook Pro 15" />
				</div>
				<div class="form-group">
					<label for="pcat">Kategorie</label>
					<select id="pcat" bind:value={category}>
						{#each categories as cat}
							<option value={cat}>{cat}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="input-section">
				<h3>🌱 Nachhaltigkeitsdaten</h3>
				<div class="slider-group">
					<label for="recycled-content">Recyclinganteil: <strong>{recycledContent}%</strong></label>
					<input id="recycled-content" type="range" bind:value={recycledContent} min="0" max="100" step="1" class="slider green" />
				</div>
				<div class="slider-group">
					<label for="carbon-fp">CO₂-Fußabdruck: <strong>{carbonFootprint} kg CO₂e</strong></label>
					<input id="carbon-fp" type="range" bind:value={carbonFootprint} min="0" max="1000" step="10" class="slider orange" />
				</div>
				<div class="slider-group">
					<label for="energy-cons">Energieverbrauch: <strong>{energyConsumption} kWh/Jahr</strong></label>
					<input id="energy-cons" type="range" bind:value={energyConsumption} min="0" max="500" step="5" class="slider orange" />
				</div>
				<div class="slider-group">
					<label for="durability">Lebensdauer: <strong>{durabilityYears} Jahre</strong></label>
					<input id="durability" type="range" bind:value={durabilityYears} min="1" max="30" step="1" class="slider blue" />
				</div>
			</div>

			<div class="input-section">
				<h3>🔧 Reparierbarkeit &amp; Zirkularität</h3>
				<div class="slider-group">
					<label for="repairability">Reparierbarkeitsindex: <strong>{repairabilityScore}/10</strong></label>
					<input id="repairability" type="range" bind:value={repairabilityScore} min="1" max="10" step="1" class="slider blue" />
					<div class="repair-labels">
						<span>Schwer reparierbar</span>
						<span>Leicht reparierbar</span>
					</div>
				</div>
				<div class="checkbox-group">
					<label class="cb-item">
						<input type="checkbox" bind:checked={recyclable} />
						<span>Produkt ist recycelbar</span>
					</label>
					<label class="cb-item">
						<input type="checkbox" bind:checked={repairInstructions} />
						<span>Reparaturanleitungen verfügbar</span>
					</label>
					<label class="cb-item">
						<input type="checkbox" bind:checked={spareParts} />
						<span>Ersatzteile erhältlich</span>
					</label>
				</div>
			</div>

			<div class="input-section">
				<h3>📊 Transparenz &amp; Compliance</h3>
				<div class="checkbox-group">
					<label class="cb-item">
						<input type="checkbox" bind:checked={hasSupplyChainData} />
						<span>Lieferkettendaten dokumentiert</span>
					</label>
					<label class="cb-item">
						<input type="checkbox" bind:checked={hasCertifications} />
						<span>EU-Zertifizierungen vorhanden</span>
					</label>
				</div>
			</div>

			<div class="calc-actions">
				<button class="btn-calc-local" onclick={calculateLocalScore}>
					⚡ Schnellkalkulation
				</button>
				<button class="btn-calc-ai" onclick={calculateWithAI} disabled={calculating}>
					{calculating ? '⏳ KI berechnet...' : '🤖 KI-Berechnung'}
				</button>
			</div>
		</div>

		<div class="result-panel">
			{#if result}
				<div class="result-header">
					<h2>Ergebnis</h2>
					{#if productName}
						<p class="product-label">{productName} – {category}</p>
					{/if}
				</div>

				<!-- Overall Score -->
				<div class="score-circle-container">
					<div class="score-circle" style="--score-color: {getScoreColor(result.overallScore)}">
						<div class="score-number">{result.overallScore}</div>
						<div class="score-max">/100</div>
					</div>
					<div class="score-label" style="color: {getScoreColor(result.overallScore)}">
						{getScoreLabel(result.overallScore)}
					</div>
					<p class="score-title">DPP Gesamtscore</p>
				</div>

				<!-- Sub Scores -->
				<div class="sub-scores">
					<div class="sub-score">
						<div class="sub-score-label">🌱 Nachhaltigkeit</div>
						<div class="progress-bar">
							<div class="progress-fill" style="width: {result.sustainabilityScore}%; background: {getScoreColor(result.sustainabilityScore)}"></div>
						</div>
						<div class="sub-score-value">{result.sustainabilityScore}</div>
					</div>
					<div class="sub-score">
						<div class="sub-score-label">♻️ Zirkularität</div>
						<div class="progress-bar">
							<div class="progress-fill" style="width: {result.circularityScore}%; background: {getScoreColor(result.circularityScore)}"></div>
						</div>
						<div class="sub-score-value">{result.circularityScore}</div>
					</div>
					<div class="sub-score">
						<div class="sub-score-label">📊 Transparenz</div>
						<div class="progress-bar">
							<div class="progress-fill" style="width: {result.transparencyScore}%; background: {getScoreColor(result.transparencyScore)}"></div>
						</div>
						<div class="sub-score-value">{result.transparencyScore}</div>
					</div>
					<div class="sub-score">
						<div class="sub-score-label">🔧 Reparierbarkeit</div>
						<div class="progress-bar">
							<div class="progress-fill" style="width: {result.repairabilityScore}%; background: {getScoreColor(result.repairabilityScore)}"></div>
						</div>
						<div class="sub-score-value">{result.repairabilityScore}</div>
					</div>
				</div>

				<!-- EU Compliance -->
				<div class="compliance-section">
					<h3>EU-Konformität</h3>
					<div class="compliance-grid">
						<div class="compliance-item" class:compliant={result.euCompliance.ecodesign}>
							<span class="compliance-icon">{result.euCompliance.ecodesign ? '✅' : '❌'}</span>
							<span>Ökodesign (ESPR)</span>
						</div>
						<div class="compliance-item" class:compliant={result.euCompliance.batteryRegulation}>
							<span class="compliance-icon">{result.euCompliance.batteryRegulation ? '✅' : '❌'}</span>
							<span>Batterieverordnung</span>
						</div>
						<div class="compliance-item" class:compliant={result.euCompliance.wasteElectronics}>
							<span class="compliance-icon">{result.euCompliance.wasteElectronics ? '✅' : '❌'}</span>
							<span>WEEE / Elektroschrott</span>
						</div>
						<div class="compliance-item" class:compliant={result.euCompliance.chemicalSafety}>
							<span class="compliance-icon">{result.euCompliance.chemicalSafety ? '✅' : '❌'}</span>
							<span>Chemikaliensicherheit (REACH)</span>
						</div>
						<div class="compliance-item" class:compliant={result.euCompliance.supplyChain}>
							<span class="compliance-icon">{result.euCompliance.supplyChain ? '✅' : '❌'}</span>
							<span>Lieferkettentransparenz</span>
						</div>
					</div>
				</div>

				<!-- Recommendations -->
				{#if result.recommendations.length > 0}
					<div class="recommendations">
						<h3>💡 Empfehlungen</h3>
						<ul>
							{#each result.recommendations as rec}
								<li>{rec}</li>
							{/each}
						</ul>
					</div>
				{/if}
			{:else}
				<div class="result-placeholder">
					<div class="placeholder-icon">🧮</div>
					<h3>Kalkulation starten</h3>
					<p>Geben Sie Ihre Produktdaten ein und klicken Sie auf "Schnellkalkulation" oder "KI-Berechnung", um den DPP-Score zu ermitteln.</p>
					<div class="score-examples">
						<div class="score-example" style="--c: #48bb78">
							<span>75–100</span>
							<span>Gut</span>
						</div>
						<div class="score-example" style="--c: #ed8936">
							<span>50–74</span>
							<span>Mittel</span>
						</div>
						<div class="score-example" style="--c: #fc8181">
							<span>0–49</span>
							<span>Verbesserungsbedarf</span>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.calculator-page {
		height: 100%;
	}

	.calc-layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		align-items: start;
	}

	/* Input Panel */
	.input-panel {
		background: white;
		border-radius: 12px;
		padding: 1.75rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
	}

	.panel-header h2 {
		font-size: 1.25rem;
		font-weight: 700;
		color: #2d3748;
		margin-bottom: 0.25rem;
	}

	.panel-header p {
		font-size: 0.875rem;
		color: #718096;
		margin-bottom: 1.5rem;
	}

	.input-section {
		margin-bottom: 1.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid #f0f4f8;
	}

	.input-section:last-of-type {
		border-bottom: none;
	}

	.input-section h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: #4a5568;
		margin-bottom: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.form-group {
		margin-bottom: 0.875rem;
	}

	.form-group label {
		display: block;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #4a5568;
		margin-bottom: 0.375rem;
	}

	.form-group input,
	.form-group select {
		width: 100%;
		padding: 0.625rem 0.875rem;
		border: 1.5px solid #e2e8f0;
		border-radius: 7px;
		font-size: 0.9375rem;
		color: #2d3748;
		outline: none;
		background: white;
	}

	.form-group input:focus,
	.form-group select:focus {
		border-color: #4299e1;
	}

	/* Sliders */
	.slider-group {
		margin-bottom: 1rem;
	}

	.slider-group label {
		display: block;
		font-size: 0.8125rem;
		color: #4a5568;
		margin-bottom: 0.375rem;
	}

	.slider-group label strong {
		color: #2d3748;
	}

	.slider {
		width: 100%;
		height: 6px;
		border-radius: 3px;
		outline: none;
		cursor: pointer;
		appearance: none;
	}

	.slider.green { accent-color: #48bb78; }
	.slider.orange { accent-color: #ed8936; }
	.slider.blue { accent-color: #4299e1; }

	.repair-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.6875rem;
		color: #a0aec0;
		margin-top: 0.25rem;
	}

	/* Checkboxes */
	.checkbox-group {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.cb-item {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		font-size: 0.875rem;
		color: #4a5568;
		cursor: pointer;
	}

	.cb-item input {
		width: 1rem;
		height: 1rem;
		cursor: pointer;
		accent-color: #4299e1;
	}

	/* Calc Actions */
	.calc-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.btn-calc-local {
		flex: 1;
		padding: 0.75rem;
		background: #ebf8ff;
		color: #2b6cb0;
		border: 1.5px solid #bee3f8;
		border-radius: 8px;
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-calc-local:hover {
		background: #bee3f8;
	}

	.btn-calc-ai {
		flex: 1;
		padding: 0.75rem;
		background: linear-gradient(135deg, #553c9a, #6b46c1);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.btn-calc-ai:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-calc-ai:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Result Panel */
	.result-panel {
		background: white;
		border-radius: 12px;
		padding: 1.75rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
	}

	.result-header h2 {
		font-size: 1.25rem;
		font-weight: 700;
		color: #2d3748;
		margin-bottom: 0.25rem;
	}

	.product-label {
		font-size: 0.875rem;
		color: #718096;
		margin-bottom: 1.5rem;
	}

	/* Score Circle */
	.score-circle-container {
		text-align: center;
		margin: 1.5rem 0;
	}

	.score-circle {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 120px;
		height: 120px;
		border-radius: 50%;
		border: 6px solid var(--score-color);
		margin-bottom: 0.75rem;
	}

	.score-number {
		font-size: 2.25rem;
		font-weight: 700;
		color: #2d3748;
		line-height: 1;
	}

	.score-max {
		font-size: 0.875rem;
		color: #718096;
	}

	.score-label {
		font-size: 1.125rem;
		font-weight: 700;
		margin-bottom: 0.25rem;
	}

	.score-title {
		font-size: 0.875rem;
		color: #718096;
	}

	/* Sub Scores */
	.sub-scores {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin: 1.5rem 0;
	}

	.sub-score {
		display: grid;
		grid-template-columns: 140px 1fr 2.5rem;
		align-items: center;
		gap: 0.75rem;
	}

	.sub-score-label {
		font-size: 0.8125rem;
		color: #4a5568;
	}

	.progress-bar {
		background: #edf2f7;
		border-radius: 9999px;
		height: 8px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		border-radius: 9999px;
		transition: width 0.5s ease;
	}

	.sub-score-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: #2d3748;
		text-align: right;
	}

	/* EU Compliance */
	.compliance-section {
		margin: 1.5rem 0;
	}

	.compliance-section h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: #4a5568;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.875rem;
	}

	.compliance-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.compliance-item {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		font-size: 0.875rem;
		color: #718096;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		background: #fff5f5;
	}

	.compliance-item.compliant {
		background: #f0fff4;
		color: #276749;
	}

	.compliance-icon {
		font-size: 1rem;
	}

	/* Recommendations */
	.recommendations {
		margin-top: 1.5rem;
	}

	.recommendations h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: #4a5568;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.875rem;
	}

	.recommendations ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.recommendations li {
		font-size: 0.8125rem;
		color: #4a5568;
		padding: 0.625rem 0.75rem;
		background: #fffbeb;
		border-left: 3px solid #ed8936;
		border-radius: 0 6px 6px 0;
		line-height: 1.4;
	}

	/* Placeholder */
	.result-placeholder {
		text-align: center;
		padding: 2rem 1rem;
		color: #718096;
	}

	.placeholder-icon {
		font-size: 3.5rem;
		margin-bottom: 1rem;
	}

	.result-placeholder h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #2d3748;
		margin-bottom: 0.75rem;
	}

	.result-placeholder p {
		font-size: 0.875rem;
		line-height: 1.6;
		margin-bottom: 1.5rem;
	}

	.score-examples {
		display: flex;
		justify-content: center;
		gap: 1rem;
	}

	.score-example {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		border: 2px solid var(--c);
	}

	.score-example span:first-child {
		font-size: 1rem;
		font-weight: 700;
		color: var(--c);
	}

	.score-example span:last-child {
		font-size: 0.75rem;
		color: #718096;
	}

	/* Alert */
	.alert {
		padding: 0.875rem 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.alert-error {
		background: #fff5f5;
		color: #c53030;
		border: 1px solid #fed7d7;
	}

	/* Responsive */
	@media (max-width: 900px) {
		.calc-layout {
			grid-template-columns: 1fr;
		}
	}
</style>
