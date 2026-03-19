<script lang="ts">
	import { onMount } from 'svelte';
	import { currentUser, createDppRecord, getDppRecords, deleteDppRecord } from '$lib/pocketbase';
	import type { DppProduct } from '$lib/types';

	let products = $state<DppProduct[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let analyzing = $state(false);
	let showForm = $state(false);
	let analysisResult = $state('');
	let error = $state('');
	let successMsg = $state('');
	let fileInput: HTMLInputElement | undefined = $state();
	let selectedFiles: FileList | null = $state(null);

	// Form state
	let form = $state<Omit<DppProduct, 'id' | 'files' | 'created' | 'updated'>>({
		name: '',
		category: 'Elektronik',
		manufacturer: '',
		model: '',
		serialNumber: '',
		materials: [{ name: '', percentage: 0, recyclable: false, origin: '' }],
		sustainability: {
			carbonFootprint: 0,
			energyConsumption: 0,
			waterUsage: 0,
			repairabilityScore: 5,
			durabilityYears: 5,
			recycledContent: 0
		},
		certifications: []
	});

	const categories = [
		'Elektronik', 'Haushaltsgeräte', 'Textilien', 'Möbel', 'Fahrzeuge',
		'Batterien', 'Verpackungen', 'Baumaterialien', 'Spielzeug', 'Sonstiges'
	];

	const certificationOptions = [
		'CE', 'Energy Star', 'EU Ecolabel', 'Blauer Engel', 'EPEAT',
		'TCO Certified', 'FSC', 'OEKO-TEX', 'ISO 14001', 'ISO 50001'
	];

	onMount(async () => {
		await loadProducts();
	});

	async function loadProducts() {
		loading = true;
		try {
			const result = await getDppRecords();
			products = result.items as unknown as DppProduct[];
		} catch (e) {
			console.warn('PocketBase unavailable:', e);
		} finally {
			loading = false;
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		saving = true;
		error = '';
		try {
			const formData = new FormData();
			formData.append('name', form.name);
			formData.append('category', form.category);
			formData.append('manufacturer', form.manufacturer);
			formData.append('model', form.model);
			formData.append('serialNumber', form.serialNumber);
			formData.append('materials', JSON.stringify(form.materials));
			formData.append('sustainability', JSON.stringify(form.sustainability));
			formData.append('certifications', JSON.stringify(form.certifications));
			formData.append('user', $currentUser?.id ?? '');

			if (selectedFiles) {
				for (const file of Array.from(selectedFiles)) {
					formData.append('files', file);
				}
			}

			await createDppRecord(formData);
			successMsg = 'DPP-Eintrag erfolgreich gespeichert!';
			showForm = false;
			resetForm();
			await loadProducts();
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Fehler beim Speichern.';
		} finally {
			saving = false;
			setTimeout(() => { successMsg = ''; }, 3000);
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('Diesen DPP-Eintrag wirklich löschen?')) return;
		try {
			await deleteDppRecord(id);
			await loadProducts();
		} catch (err) {
			error = 'Fehler beim Löschen.';
		}
	}

	async function analyzeWithAI() {
		analyzing = true;
		analysisResult = '';
		try {
			const productData = JSON.stringify(form, null, 2);
			const response = await fetch('/api/ai/analyze', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ productData })
			});
			const data = await response.json();
			analysisResult = data.text;
		} catch (err) {
			analysisResult = 'KI-Analyse nicht verfügbar. Bitte GEMINI_API_KEY konfigurieren.';
		} finally {
			analyzing = false;
		}
	}

	async function researchProduct() {
		if (!form.name || !form.manufacturer) {
			error = 'Bitte Produktname und Hersteller eingeben.';
			return;
		}
		analyzing = true;
		analysisResult = '';
		try {
			const response = await fetch('/api/ai/research', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ productName: form.name, manufacturer: form.manufacturer })
			});
			const data = await response.json();
			analysisResult = data.text;
		} catch (err) {
			analysisResult = 'Recherche nicht verfügbar. Bitte GEMINI_API_KEY konfigurieren.';
		} finally {
			analyzing = false;
		}
	}

	function resetForm() {
		form = {
			name: '',
			category: 'Elektronik',
			manufacturer: '',
			model: '',
			serialNumber: '',
			materials: [{ name: '', percentage: 0, recyclable: false, origin: '' }],
			sustainability: {
				carbonFootprint: 0,
				energyConsumption: 0,
				waterUsage: 0,
				repairabilityScore: 5,
				durabilityYears: 5,
				recycledContent: 0
			},
			certifications: []
		};
		selectedFiles = null;
		analysisResult = '';
	}

	function addMaterial() {
		form.materials = [...form.materials, { name: '', percentage: 0, recyclable: false, origin: '' }];
	}

	function removeMaterial(index: number) {
		form.materials = form.materials.filter((_, i) => i !== index);
	}

	function toggleCertification(cert: string) {
		if (form.certifications.includes(cert)) {
			form.certifications = form.certifications.filter((c) => c !== cert);
		} else {
			form.certifications = [...form.certifications, cert];
		}
	}
</script>

<svelte:head>
	<title>DPP Beratung – DPP-O-Matic</title>
</svelte:head>

<div class="dpp-page">
	{#if successMsg}
		<div class="alert alert-success">{successMsg}</div>
	{/if}
	{#if error}
		<div class="alert alert-error">{error}</div>
	{/if}

	<div class="page-header">
		<div>
			<h2>Digitale Produktpässe</h2>
			<p>Erstellen und verwalten Sie EU-konforme Produktpässe</p>
		</div>
		<button class="btn-primary" onclick={() => { showForm = !showForm; resetForm(); }}>
			{showForm ? '✕ Abbrechen' : '+ Neuer DPP'}
		</button>
	</div>

	{#if showForm}
		<div class="form-card">
			<h3>Neuer Digitaler Produktpass</h3>

			<form onsubmit={handleSubmit}>
				<!-- Basic Info -->
				<div class="section">
					<h4>📦 Produktinformationen</h4>
					<div class="form-grid">
						<div class="form-group">
							<label for="name">Produktname *</label>
							<input id="name" type="text" bind:value={form.name} required placeholder="z.B. Smartphone X Pro" />
						</div>
						<div class="form-group">
							<label for="category">Kategorie *</label>
							<select id="category" bind:value={form.category}>
								{#each categories as cat}
									<option value={cat}>{cat}</option>
								{/each}
							</select>
						</div>
						<div class="form-group">
							<label for="manufacturer">Hersteller *</label>
							<input id="manufacturer" type="text" bind:value={form.manufacturer} required placeholder="Unternehmensname" />
						</div>
						<div class="form-group">
							<label for="model">Modell/Version</label>
							<input id="model" type="text" bind:value={form.model} placeholder="Modellbezeichnung" />
						</div>
						<div class="form-group">
							<label for="serial">Seriennummer</label>
							<input id="serial" type="text" bind:value={form.serialNumber} placeholder="Eindeutige Kennnummer" />
						</div>
					</div>
					<div class="ai-actions">
						<button type="button" class="btn-ai" onclick={researchProduct} disabled={analyzing}>
							{analyzing ? '⏳ Recherchiere...' : '🔍 KI-Recherche'}
						</button>
					</div>
				</div>

				<!-- Materials -->
				<div class="section">
					<h4>⚗️ Materialzusammensetzung</h4>
					{#each form.materials as material, i}
						<div class="material-row">
							<input type="text" bind:value={material.name} placeholder="Material" class="mat-name" />
							<input type="number" bind:value={material.percentage} placeholder="%" min="0" max="100" class="mat-pct" />
							<input type="text" bind:value={material.origin} placeholder="Herkunft" class="mat-origin" />
							<label class="checkbox-label">
								<input type="checkbox" bind:checked={material.recyclable} />
								Recycelbar
							</label>
							<button type="button" class="btn-remove" onclick={() => removeMaterial(i)}>✕</button>
						</div>
					{/each}
					<button type="button" class="btn-add" onclick={addMaterial}>+ Material hinzufügen</button>
				</div>

				<!-- Sustainability -->
				<div class="section">
					<h4>🌱 Nachhaltigkeitsdaten</h4>
					<div class="form-grid">
						<div class="form-group">
							<label for="carbon">CO₂-Fußabdruck (kg CO₂e)</label>
							<input id="carbon" type="number" bind:value={form.sustainability.carbonFootprint} min="0" placeholder="kg CO₂-Äquivalent" />
						</div>
						<div class="form-group">
							<label for="energy">Energieverbrauch (kWh/Jahr)</label>
							<input id="energy" type="number" bind:value={form.sustainability.energyConsumption} min="0" placeholder="kWh pro Jahr" />
						</div>
						<div class="form-group">
							<label for="water">Wasserverbrauch (Liter)</label>
							<input id="water" type="number" bind:value={form.sustainability.waterUsage} min="0" placeholder="Liter Produktionswasser" />
						</div>
						<div class="form-group">
							<label for="repair">Reparierbarkeitsindex (1-10)</label>
							<input id="repair" type="range" bind:value={form.sustainability.repairabilityScore} min="1" max="10" step="1" />
							<span class="range-value">{form.sustainability.repairabilityScore}/10</span>
						</div>
						<div class="form-group">
							<label for="durability">Lebensdauer (Jahre)</label>
							<input id="durability" type="number" bind:value={form.sustainability.durabilityYears} min="0" placeholder="Erwartete Lebensdauer" />
						</div>
						<div class="form-group">
							<label for="recycled">Recyclinganteil (%)</label>
							<input id="recycled" type="number" bind:value={form.sustainability.recycledContent} min="0" max="100" placeholder="% recycelte Materialien" />
						</div>
					</div>
				</div>

				<!-- Certifications -->
				<div class="section">
					<h4>🏆 Zertifizierungen</h4>
					<div class="cert-grid">
						{#each certificationOptions as cert}
							<label class="cert-chip" class:selected={form.certifications.includes(cert)}>
								<input
									type="checkbox"
									checked={form.certifications.includes(cert)}
									onchange={() => toggleCertification(cert)}
								/>
								{cert}
							</label>
						{/each}
					</div>
				</div>

				<!-- File Upload -->
				<div class="section">
					<h4>📎 Dokumente hochladen</h4>
					<div class="upload-area">
						<input
							type="file"
							multiple
							accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx"
							bind:this={fileInput}
							onchange={(e) => { selectedFiles = (e.target as HTMLInputElement).files; }}
							class="file-input"
							id="fileUpload"
						/>
						<label for="fileUpload" class="upload-label">
							<span class="upload-icon">📁</span>
							<span>Dateien auswählen oder hierher ziehen</span>
							<span class="upload-hint">PDF, Word, Excel, Bilder (max. 10 MB je Datei)</span>
						</label>
						{#if selectedFiles && selectedFiles.length > 0}
							<div class="file-list">
								{#each Array.from(selectedFiles) as file}
									<div class="file-item">
										<span>📄 {file.name}</span>
										<span class="file-size">{(file.size / 1024).toFixed(1)} KB</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- AI Analysis -->
				<div class="section">
					<h4>🤖 KI-Analyse</h4>
					<button type="button" class="btn-ai" onclick={analyzeWithAI} disabled={analyzing}>
						{analyzing ? '⏳ Analysiere...' : '🤖 KI-Konformitätsprüfung'}
					</button>
					{#if analysisResult}
						<div class="analysis-result">
							<pre>{analysisResult}</pre>
						</div>
					{/if}
				</div>

				<div class="form-actions">
					<button type="submit" class="btn-primary" disabled={saving}>
						{saving ? '⏳ Speichern...' : '💾 DPP Speichern'}
					</button>
					<button type="button" class="btn-secondary" onclick={() => { showForm = false; resetForm(); }}>
						Abbrechen
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Products List -->
	<div class="products-section">
		<h3>Ihre Produktpässe</h3>
		{#if loading}
			<div class="loading">⏳ Lade Produktpässe...</div>
		{:else if products.length === 0}
			<div class="empty-state">
				<div class="empty-icon">📋</div>
				<p>Noch keine Produktpässe vorhanden.</p>
				<p>Klicken Sie auf "+ Neuer DPP" um zu beginnen.</p>
			</div>
		{:else}
			<div class="products-grid">
				{#each products as product}
					<div class="product-card">
						<div class="product-header">
							<div>
								<h4>{product.name}</h4>
								<span class="category-badge">{product.category}</span>
							</div>
							<button class="btn-delete" onclick={() => handleDelete(product.id!)}>🗑️</button>
						</div>
						<div class="product-details">
							<div class="detail-row">
								<span>Hersteller:</span>
								<span>{product.manufacturer}</span>
							</div>
							{#if product.model}
								<div class="detail-row">
									<span>Modell:</span>
									<span>{product.model}</span>
								</div>
							{/if}
							{#if product.sustainability}
								<div class="detail-row">
									<span>CO₂:</span>
									<span>{product.sustainability.carbonFootprint} kg CO₂e</span>
								</div>
								<div class="detail-row">
									<span>Recyclinganteil:</span>
									<span>{product.sustainability.recycledContent}%</span>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.dpp-page {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.page-header h2 {
		font-size: 1.375rem;
		font-weight: 700;
		color: #2d3748;
	}

	.page-header p {
		font-size: 0.875rem;
		color: #718096;
		margin-top: 0.25rem;
	}

	.form-card {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
	}

	.form-card h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #2d3748;
		margin-bottom: 1.5rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.section {
		margin-bottom: 2rem;
	}

	.section h4 {
		font-size: 0.9375rem;
		font-weight: 600;
		color: #2d3748;
		margin-bottom: 1rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid #f0f4f8;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.form-group label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: #4a5568;
	}

	.form-group input,
	.form-group select {
		padding: 0.625rem 0.875rem;
		border: 1.5px solid #e2e8f0;
		border-radius: 7px;
		font-size: 0.9375rem;
		color: #2d3748;
		outline: none;
		transition: border-color 0.2s;
		background: white;
	}

	.form-group input:focus,
	.form-group select:focus {
		border-color: #4299e1;
		box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
	}

	.range-value {
		font-size: 0.875rem;
		color: #4299e1;
		font-weight: 600;
	}

	/* Materials */
	.material-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 0.5rem;
		flex-wrap: wrap;
	}

	.mat-name { flex: 2; min-width: 120px; }
	.mat-pct { width: 70px; flex-shrink: 0; }
	.mat-origin { flex: 1; min-width: 100px; }

	.material-row input {
		padding: 0.5rem 0.75rem;
		border: 1.5px solid #e2e8f0;
		border-radius: 7px;
		font-size: 0.875rem;
		outline: none;
	}

	.material-row input:focus {
		border-color: #4299e1;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: #4a5568;
		cursor: pointer;
		white-space: nowrap;
	}

	.btn-remove {
		background: #fff5f5;
		border: 1px solid #fed7d7;
		color: #c53030;
		border-radius: 6px;
		padding: 0.375rem 0.625rem;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.btn-add {
		background: #ebf8ff;
		border: 1px dashed #4299e1;
		color: #2b6cb0;
		border-radius: 7px;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		cursor: pointer;
		margin-top: 0.5rem;
		transition: all 0.2s;
	}

	.btn-add:hover {
		background: #bee3f8;
	}

	/* Certifications */
	.cert-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.cert-chip {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.875rem;
		border: 1.5px solid #e2e8f0;
		border-radius: 9999px;
		font-size: 0.8125rem;
		cursor: pointer;
		transition: all 0.2s;
		color: #4a5568;
	}

	.cert-chip:hover {
		border-color: #4299e1;
		color: #2b6cb0;
	}

	.cert-chip.selected {
		background: #ebf8ff;
		border-color: #4299e1;
		color: #2b6cb0;
		font-weight: 500;
	}

	.cert-chip input {
		display: none;
	}

	/* File Upload */
	.upload-area {
		border: 2px dashed #e2e8f0;
		border-radius: 10px;
		overflow: hidden;
	}

	.file-input {
		display: none;
	}

	.upload-label {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		cursor: pointer;
		transition: background 0.2s;
		gap: 0.5rem;
	}

	.upload-label:hover {
		background: #f7fafc;
	}

	.upload-icon {
		font-size: 2rem;
	}

	.upload-label span:nth-child(2) {
		font-size: 0.9375rem;
		color: #4a5568;
		font-weight: 500;
	}

	.upload-hint {
		font-size: 0.75rem;
		color: #a0aec0 !important;
		font-weight: normal !important;
	}

	.file-list {
		border-top: 1px solid #e2e8f0;
		padding: 0.75rem;
	}

	.file-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.375rem 0.5rem;
		font-size: 0.8125rem;
		color: #4a5568;
		border-radius: 5px;
	}

	.file-item:hover {
		background: #f7fafc;
	}

	.file-size {
		color: #a0aec0;
	}

	/* AI Actions */
	.ai-actions {
		margin-top: 0.75rem;
	}

	.btn-ai {
		background: linear-gradient(135deg, #553c9a, #6b46c1);
		color: white;
		border: none;
		border-radius: 7px;
		padding: 0.625rem 1.25rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.btn-ai:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-ai:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.analysis-result {
		margin-top: 1rem;
		background: #f7fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 1rem;
		max-height: 300px;
		overflow-y: auto;
	}

	.analysis-result pre {
		font-family: inherit;
		font-size: 0.875rem;
		color: #2d3748;
		white-space: pre-wrap;
		line-height: 1.6;
	}

	/* Form actions */
	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
	}

	.btn-primary {
		background: linear-gradient(135deg, #1a365d, #2b6cb0);
		color: white;
		border: none;
		border-radius: 8px;
		padding: 0.75rem 1.5rem;
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.btn-primary:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: white;
		color: #4a5568;
		border: 1.5px solid #e2e8f0;
		border-radius: 8px;
		padding: 0.75rem 1.5rem;
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-secondary:hover {
		border-color: #4299e1;
		color: #2b6cb0;
	}

	/* Products list */
	.products-section h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #2d3748;
		margin-bottom: 1rem;
	}

	.products-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
	}

	.product-card {
		background: white;
		border-radius: 10px;
		padding: 1.25rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
		border: 1px solid #e2e8f0;
		transition: box-shadow 0.2s;
	}

	.product-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.product-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.875rem;
	}

	.product-header h4 {
		font-size: 0.9375rem;
		font-weight: 600;
		color: #2d3748;
		margin-bottom: 0.25rem;
	}

	.category-badge {
		background: #ebf8ff;
		color: #2b6cb0;
		font-size: 0.6875rem;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		font-weight: 500;
	}

	.btn-delete {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		opacity: 0.6;
		transition: opacity 0.2s;
		padding: 0.125rem;
	}

	.btn-delete:hover {
		opacity: 1;
	}

	.product-details {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.8125rem;
		color: #718096;
	}

	.detail-row span:last-child {
		color: #4a5568;
		font-weight: 500;
	}

	/* Alerts */
	.alert {
		padding: 0.875rem 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
	}

	.alert-error {
		background: #fff5f5;
		color: #c53030;
		border: 1px solid #fed7d7;
	}

	.alert-success {
		background: #f0fff4;
		color: #276749;
		border: 1px solid #c6f6d5;
	}

	.loading {
		text-align: center;
		padding: 2rem;
		color: #718096;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 2rem;
		background: white;
		border-radius: 10px;
		border: 2px dashed #e2e8f0;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.empty-state p {
		color: #718096;
		font-size: 0.9375rem;
	}
</style>
