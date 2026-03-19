<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { currentUser, logout } from '$lib/pocketbase';
	import { sidebarOpen } from '$lib/stores';

	let { children } = $props();

	const navItems = [
		{ href: '/', label: 'Dashboard', icon: '🏠' },
		{ href: '/dpp', label: 'DPP Beratung', icon: '📋' },
		{ href: '/calculator', label: 'Kalkulator', icon: '🧮' },
		{ href: '/chat', label: 'KI-Assistent', icon: '🤖' }
	];

	const publicRoutes = ['/login', '/register'];

	onMount(() => {
		const unsubscribe = currentUser.subscribe((user) => {
			const isPublicRoute = publicRoutes.includes($page.url.pathname);
			if (!user && !isPublicRoute) {
				goto('/login');
			} else if (user && isPublicRoute) {
				goto('/');
			}
		});
		return unsubscribe;
	});

	function handleLogout() {
		logout();
		goto('/login');
	}

	function toggleSidebar() {
		sidebarOpen.update((v) => !v);
	}
</script>

<svelte:head>
	<link rel="icon" href="/favicon.png" />
</svelte:head>

<div class="app-shell">
	{#if $currentUser}
		<aside class="sidebar" class:open={$sidebarOpen}>
			<div class="sidebar-header">
				<div class="logo">
					<span class="logo-icon">♻️</span>
					<span class="logo-text">DPP-O-Matic</span>
				</div>
			</div>
			<nav class="sidebar-nav">
				{#each navItems as item}
					<a
						href={item.href}
						class="nav-item"
						class:active={$page.url.pathname === item.href}
						onclick={() => sidebarOpen.set(false)}
					>
						<span class="nav-icon">{item.icon}</span>
						<span class="nav-label">{item.label}</span>
					</a>
				{/each}
			</nav>
			<div class="sidebar-footer">
				<div class="user-info">
					<div class="user-avatar">{$currentUser.name?.charAt(0)?.toUpperCase() ?? '?'}</div>
					<div class="user-details">
						<span class="user-name">{$currentUser.name ?? $currentUser.email}</span>
						<span class="user-email">{$currentUser.email}</span>
					</div>
				</div>
				<button class="btn-logout" onclick={handleLogout}>Abmelden</button>
			</div>
		</aside>

		<div class="main-wrapper">
			<header class="topbar">
				<button class="menu-toggle" onclick={toggleSidebar} aria-label="Menü umschalten">
					☰
				</button>
				<h1 class="page-title">
					{navItems.find((n) => n.href === $page.url.pathname)?.label ?? 'DPP-O-Matic'}
				</h1>
			</header>
			<main class="main-content">
				{@render children()}
			</main>
		</div>

		{#if $sidebarOpen}
			<button
				class="sidebar-overlay"
				onclick={() => sidebarOpen.set(false)}
				aria-label="Sidebar schließen"
			></button>
		{/if}
	{:else}
		<main class="auth-wrapper">
			{@render children()}
		</main>
	{/if}
</div>

<style>
	:global(*) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
		background: #f0f4f8;
		color: #1a202c;
		min-height: 100vh;
	}

	:global(button) {
		cursor: pointer;
	}

	:global(input, select, textarea) {
		font-family: inherit;
	}

	.app-shell {
		display: flex;
		min-height: 100vh;
	}

	/* Sidebar */
	.sidebar {
		width: 260px;
		background: linear-gradient(180deg, #1a365d 0%, #2a4a7f 100%);
		color: white;
		display: flex;
		flex-direction: column;
		position: fixed;
		top: 0;
		left: 0;
		height: 100vh;
		z-index: 200;
		transition: transform 0.3s ease;
	}

	.sidebar-header {
		padding: 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.logo-icon {
		font-size: 1.75rem;
	}

	.logo-text {
		font-size: 1.25rem;
		font-weight: 700;
		color: #90cdf4;
	}

	.sidebar-nav {
		flex: 1;
		padding: 1rem 0;
		overflow-y: auto;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 0.875rem 1.5rem;
		color: rgba(255, 255, 255, 0.75);
		text-decoration: none;
		font-size: 0.9375rem;
		transition: all 0.2s;
		border-left: 3px solid transparent;
	}

	.nav-item:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
		border-left-color: #63b3ed;
	}

	.nav-item.active {
		background: rgba(255, 255, 255, 0.15);
		color: white;
		border-left-color: #4299e1;
		font-weight: 600;
	}

	.nav-icon {
		font-size: 1.25rem;
		width: 1.5rem;
		text-align: center;
	}

	.sidebar-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.user-avatar {
		width: 2.25rem;
		height: 2.25rem;
		background: #4299e1;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 0.9375rem;
		flex-shrink: 0;
	}

	.user-details {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.user-name {
		font-size: 0.875rem;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.user-email {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.6);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.btn-logout {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		transition: all 0.2s;
		width: 100%;
	}

	.btn-logout:hover {
		background: rgba(255, 255, 255, 0.2);
		color: white;
	}

	/* Main Wrapper */
	.main-wrapper {
		flex: 1;
		margin-left: 260px;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.topbar {
		background: white;
		border-bottom: 1px solid #e2e8f0;
		padding: 0 1.5rem;
		height: 60px;
		display: flex;
		align-items: center;
		gap: 1rem;
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.menu-toggle {
		display: none;
		background: none;
		border: none;
		font-size: 1.5rem;
		padding: 0.25rem;
		line-height: 1;
		color: #4a5568;
	}

	.page-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #2d3748;
	}

	.main-content {
		flex: 1;
		padding: 2rem;
	}

	/* Auth Wrapper */
	.auth-wrapper {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background: linear-gradient(135deg, #1a365d 0%, #2a4a7f 50%, #1a365d 100%);
	}

	/* Overlay for mobile */
	.sidebar-overlay {
		display: none;
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 150;
		border: none;
		cursor: default;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.sidebar {
			transform: translateX(-100%);
		}

		.sidebar.open {
			transform: translateX(0);
		}

		.main-wrapper {
			margin-left: 0;
		}

		.menu-toggle {
			display: block;
		}

		.sidebar-overlay {
			display: block;
		}

		.main-content {
			padding: 1rem;
		}
	}
</style>

