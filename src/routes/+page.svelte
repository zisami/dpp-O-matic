<script lang="ts">
	import { onMount } from 'svelte';
	import { currentUser, getDppRecords } from '$lib/pocketbase';
	import type { DppProduct } from '$lib/types';

	let recentRecords = $state<DppProduct[]>([]);
	let loading = $state(true);

	onMount(async () => {
		if ($currentUser) {
			try {
				const result = await getDppRecords();
				recentRecords = result.items as unknown as DppProduct[];
			} catch (e) {
				console.warn('PocketBase not available:', e);
			} finally {
				loading = false;
			}
		} else {
			loading = false;
		}
	});

	const stats = $derived([
		{ label: 'DPP Einträge', value: recentRecords.length, icon: '📄', color: '#4299e1' },
		{ label: 'EU Konformität', value: '78%', icon: '✅', color: '#48bb78' },
		{ label: 'KI Analysen', value: '12', icon: '🤖', color: '#ed8936' },
		{ label: 'Ausstehend', value: '3', icon: '⏳', color: '#9f7aea' }
	]);
</script>

<svelte:head>
	<title>Dashboard – DPP-O-Matic</title>
</svelte:head>

<div class="dashboard">
	<div class="welcome-banner">
		<div class="welcome-text">
			<h2>Willkommen, {$currentUser?.name ?? 'Nutzer'}! 👋</h2>
			<p>Verwalten Sie Ihre digitalen EU-Produktpässe und prüfen Sie die Konformität Ihrer Produkte.</p>
		</div>
		<div class="eu-badge">
			<span class="eu-flag">🇪🇺</span>
			<span>EU DPP Ready</span>
		</div>
	</div>

	<div class="stats-grid">
		{#each stats as stat}
			<div class="stat-card" style="--accent: {stat.color}">
				<div class="stat-icon">{stat.icon}</div>
				<div class="stat-info">
					<div class="stat-value">{stat.value}</div>
					<div class="stat-label">{stat.label}</div>
				</div>
			</div>
		{/each}
	</div>

	<div class="action-grid">
		<a href="/dpp" class="action-card">
			<div class="action-icon">📋</div>
			<div class="action-content">
				<h3>DPP Beratung</h3>
				<p>Produktpass erstellen und EU-Konformität prüfen</p>
			</div>
			<div class="action-arrow">→</div>
		</a>
		<a href="/calculator" class="action-card">
			<div class="action-icon">🧮</div>
			<div class="action-content">
				<h3>DPP Kalkulator</h3>
				<p>Nachhaltigkeitsscore berechnen und optimieren</p>
			</div>
			<div class="action-arrow">→</div>
		</a>
		<a href="/chat" class="action-card">
			<div class="action-icon">🤖</div>
			<div class="action-content">
				<h3>KI-Assistent</h3>
				<p>Experten-Chat für DPP-Fragen und Recherche</p>
			</div>
			<div class="action-arrow">→</div>
		</a>
	</div>

	<div class="info-section">
		<div class="info-card">
			<h3>📌 Was ist der digitale EU-Produktpass?</h3>
			<p>
				Der digitale EU-Produktpass (DPP) ist eine Initiative im Rahmen der EU-Ökodesign-Verordnung
				(ESPR). Er enthält produktbezogene Informationen zur Unterstützung von Nachhaltigkeit,
				Kreislaufwirtschaft und Verbrauchertransparenz.
			</p>
			<div class="info-tags">
				<span class="tag">EU-ESPR</span>
				<span class="tag">Ökodesign</span>
				<span class="tag">Kreislaufwirtschaft</span>
				<span class="tag">Transparenz</span>
			</div>
		</div>
		<div class="info-card timeline-card">
			<h3>📅 DPP Zeitplan</h3>
			<div class="timeline">
				<div class="timeline-item done">
					<span class="tl-year">2024</span>
					<span class="tl-text">EU-ESPR Verordnung in Kraft</span>
				</div>
				<div class="timeline-item active">
					<span class="tl-year">2026</span>
					<span class="tl-text">DPP für Batterien &amp; Textilien</span>
				</div>
				<div class="timeline-item">
					<span class="tl-year">2027</span>
					<span class="tl-text">DPP für Elektronik &amp; Fahrzeuge</span>
				</div>
				<div class="timeline-item">
					<span class="tl-year">2030</span>
					<span class="tl-text">DPP für alle regulierten Produkte</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.welcome-banner {
		background: linear-gradient(135deg, #1a365d, #2b6cb0);
		color: white;
		border-radius: 12px;
		padding: 1.75rem 2rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.welcome-banner h2 {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
	}

	.welcome-banner p {
		opacity: 0.85;
		font-size: 0.9375rem;
	}

	.eu-badge {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		background: rgba(255, 255, 255, 0.15);
		border-radius: 10px;
		padding: 0.75rem 1.25rem;
		text-align: center;
		white-space: nowrap;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.eu-flag {
		font-size: 2rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
	}

	.stat-card {
		background: white;
		border-radius: 10px;
		padding: 1.25rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
		border-left: 4px solid var(--accent);
	}

	.stat-icon {
		font-size: 1.75rem;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #2d3748;
	}

	.stat-label {
		font-size: 0.8125rem;
		color: #718096;
	}

	.action-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1rem;
	}

	.action-card {
		background: white;
		border-radius: 10px;
		padding: 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		text-decoration: none;
		color: inherit;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
		transition: all 0.2s;
		border: 1px solid #e2e8f0;
	}

	.action-card:hover {
		border-color: #4299e1;
		box-shadow: 0 4px 12px rgba(66, 153, 225, 0.15);
		transform: translateY(-2px);
	}

	.action-icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.action-content {
		flex: 1;
	}

	.action-content h3 {
		font-size: 1rem;
		font-weight: 600;
		color: #2d3748;
		margin-bottom: 0.25rem;
	}

	.action-content p {
		font-size: 0.8125rem;
		color: #718096;
	}

	.action-arrow {
		font-size: 1.25rem;
		color: #4299e1;
		flex-shrink: 0;
	}

	.info-section {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1rem;
	}

	.info-card {
		background: white;
		border-radius: 10px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
	}

	.info-card h3 {
		font-size: 1rem;
		font-weight: 600;
		color: #2d3748;
		margin-bottom: 0.75rem;
	}

	.info-card p {
		font-size: 0.875rem;
		color: #4a5568;
		line-height: 1.6;
		margin-bottom: 1rem;
	}

	.info-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag {
		background: #ebf8ff;
		color: #2b6cb0;
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.timeline {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.timeline-item {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		font-size: 0.875rem;
		color: #718096;
		padding: 0.5rem;
		border-radius: 6px;
	}

	.timeline-item.done {
		color: #48bb78;
	}

	.timeline-item.active {
		background: #ebf8ff;
		color: #2b6cb0;
		font-weight: 600;
	}

	.tl-year {
		font-weight: 700;
		min-width: 3rem;
	}

	@media (max-width: 640px) {
		.welcome-banner {
			flex-direction: column;
			text-align: center;
		}
	}
</style>

