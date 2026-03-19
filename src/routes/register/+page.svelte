<script lang="ts">
	import { goto } from '$app/navigation';
	import { register } from '$lib/pocketbase';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let passwordConfirm = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleRegister(e: Event) {
		e.preventDefault();
		error = '';
		if (password !== passwordConfirm) {
			error = 'Die Passwörter stimmen nicht überein.';
			return;
		}
		if (password.length < 8) {
			error = 'Das Passwort muss mindestens 8 Zeichen lang sein.';
			return;
		}
		loading = true;
		try {
			await register(email, password, name);
			goto('/');
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Registrieren – DPP-O-Matic</title>
</svelte:head>

<div class="auth-card">
	<div class="auth-header">
		<div class="auth-logo">♻️</div>
		<h1>DPP-O-Matic</h1>
		<p>Digitaler EU-Produktpass</p>
	</div>

	<form onsubmit={handleRegister} class="auth-form">
		<h2>Konto erstellen</h2>

		{#if error}
			<div class="alert alert-error">{error}</div>
		{/if}

		<div class="form-group">
			<label for="name">Name / Unternehmen</label>
			<input
				id="name"
				type="text"
				bind:value={name}
				placeholder="Ihr Name oder Firmenname"
				required
				autocomplete="name"
			/>
		</div>

		<div class="form-group">
			<label for="email">E-Mail-Adresse</label>
			<input
				id="email"
				type="email"
				bind:value={email}
				placeholder="ihre@email.de"
				required
				autocomplete="email"
			/>
		</div>

		<div class="form-group">
			<label for="password">Passwort</label>
			<input
				id="password"
				type="password"
				bind:value={password}
				placeholder="Min. 8 Zeichen"
				required
				autocomplete="new-password"
				minlength="8"
			/>
		</div>

		<div class="form-group">
			<label for="passwordConfirm">Passwort bestätigen</label>
			<input
				id="passwordConfirm"
				type="password"
				bind:value={passwordConfirm}
				placeholder="Passwort wiederholen"
				required
				autocomplete="new-password"
			/>
		</div>

		<button type="submit" class="btn-primary" disabled={loading}>
			{#if loading}
				<span class="spinner"></span> Konto erstellen...
			{:else}
				Konto erstellen
			{/if}
		</button>

		<p class="auth-link">
			Bereits registriert? <a href="/login">Jetzt anmelden</a>
		</p>
	</form>
</div>

<style>
	.auth-card {
		background: white;
		border-radius: 16px;
		padding: 2.5rem;
		width: 100%;
		max-width: 420px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
	}

	.auth-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.auth-logo {
		font-size: 3rem;
		margin-bottom: 0.5rem;
	}

	.auth-header h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: #1a365d;
		margin-bottom: 0.25rem;
	}

	.auth-header p {
		color: #718096;
		font-size: 0.9375rem;
	}

	.auth-form h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #2d3748;
		margin-bottom: 1.25rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #4a5568;
		margin-bottom: 0.375rem;
	}

	.form-group input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1.5px solid #e2e8f0;
		border-radius: 8px;
		font-size: 0.9375rem;
		color: #2d3748;
		transition: border-color 0.2s;
		outline: none;
	}

	.form-group input:focus {
		border-color: #4299e1;
		box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
	}

	.btn-primary {
		width: 100%;
		padding: 0.875rem;
		background: linear-gradient(135deg, #1a365d, #2b6cb0);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.2s;
		margin-top: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.btn-primary:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-primary:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.auth-link {
		text-align: center;
		margin-top: 1.25rem;
		font-size: 0.875rem;
		color: #718096;
	}

	.auth-link a {
		color: #4299e1;
		text-decoration: none;
		font-weight: 500;
	}

	.auth-link a:hover {
		text-decoration: underline;
	}

	.alert {
		padding: 0.75rem 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.alert-error {
		background: #fff5f5;
		color: #c53030;
		border: 1px solid #fed7d7;
	}
</style>
