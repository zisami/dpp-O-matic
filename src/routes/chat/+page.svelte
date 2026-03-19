<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { chatMessages, isLoadingAI, addMessage, clearChat } from '$lib/stores';

	let input = $state('');
	let messagesContainer: HTMLDivElement | undefined = $state();

	const quickPrompts = [
		'Was ist der digitale EU-Produktpass?',
		'Welche Produkte brauchen einen DPP?',
		'Wie berechne ich den Reparierbarkeitsindex?',
		'Was sind die ESPR-Anforderungen?',
		'Wie erstelle ich einen DPP für mein Produkt?'
	];

	async function sendMessage(text?: string) {
		const message = text ?? input.trim();
		if (!message || $isLoadingAI) return;

		input = '';
		addMessage('user', message);
		isLoadingAI.set(true);

		await tick();
		scrollToBottom();

		try {
			const history = $chatMessages.slice(0, -1).map((m) => ({
				role: m.role,
				content: m.content
			}));

			const response = await fetch('/api/ai', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message, history })
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const data = await response.json();
			addMessage('assistant', data.text);
		} catch (err) {
			addMessage('assistant', 'Entschuldigung, es ist ein Fehler aufgetreten. Bitte stellen Sie sicher, dass der GEMINI_API_KEY konfiguriert ist.');
		} finally {
			isLoadingAI.set(false);
			await tick();
			scrollToBottom();
		}
	}

	function scrollToBottom() {
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	function formatText(text: string) {
		return text
			.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.*?)\*/g, '<em>$1</em>')
			.replace(/\n/g, '<br>');
	}

	onMount(() => {
		if ($chatMessages.length === 0) {
			addMessage(
				'assistant',
				'Guten Tag! Ich bin Ihr KI-Assistent für den digitalen EU-Produktpass (DPP). 🇪🇺\n\nIch kann Ihnen helfen bei:\n• **DPP-Anforderungen** und EU-Vorschriften\n• **Konformitätsprüfung** Ihrer Produkte\n• **Nachhaltigkeitsdaten** erfassen\n• **Produktrecherche** und Analyse\n\nWas möchten Sie wissen?'
			);
		}
		scrollToBottom();
	});
</script>

<svelte:head>
	<title>KI-Assistent – DPP-O-Matic</title>
</svelte:head>

<div class="chat-page">
	<div class="chat-container">
		<div class="chat-header">
			<div class="assistant-info">
				<div class="assistant-avatar">🤖</div>
				<div>
					<h2>DPP KI-Assistent</h2>
					<p>Powered by Google Gemini</p>
				</div>
			</div>
			<button class="btn-clear" onclick={clearChat} title="Chat löschen">🗑️ Löschen</button>
		</div>

		<div class="messages" bind:this={messagesContainer}>
			{#each $chatMessages as msg (msg.id)}
				<div class="message {msg.role}">
					<div class="message-avatar">
						{msg.role === 'user' ? '👤' : '🤖'}
					</div>
					<div class="message-bubble">
						<div class="message-content">
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html formatText(msg.content)}
						</div>
						<div class="message-time">
							{msg.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
						</div>
					</div>
				</div>
			{/each}

			{#if $isLoadingAI}
				<div class="message assistant">
					<div class="message-avatar">🤖</div>
					<div class="message-bubble">
						<div class="typing-indicator">
							<span></span><span></span><span></span>
						</div>
					</div>
				</div>
			{/if}
		</div>

		{#if $chatMessages.length <= 1}
			<div class="quick-prompts">
				<p>Schnellfragen:</p>
				<div class="prompts-grid">
					{#each quickPrompts as prompt}
						<button class="prompt-chip" onclick={() => sendMessage(prompt)}>
							{prompt}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<div class="chat-input-area">
			<textarea
				bind:value={input}
				onkeydown={handleKeydown}
				placeholder="Stellen Sie eine Frage zum digitalen EU-Produktpass..."
				rows="1"
				disabled={$isLoadingAI}
			></textarea>
			<button
				class="btn-send"
				onclick={() => sendMessage()}
				disabled={!input.trim() || $isLoadingAI}
				title="Senden (Enter)"
			>
				{$isLoadingAI ? '⏳' : '▶'}
			</button>
		</div>
		<p class="chat-hint">Enter zum Senden · Shift+Enter für neue Zeile</p>
	</div>
</div>

<style>
	.chat-page {
		height: calc(100vh - 60px - 4rem);
		display: flex;
		flex-direction: column;
	}

	.chat-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		background: white;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
		overflow: hidden;
		height: 100%;
	}

	.chat-header {
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e2e8f0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: white;
	}

	.assistant-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.assistant-avatar {
		font-size: 1.75rem;
	}

	.assistant-info h2 {
		font-size: 1rem;
		font-weight: 600;
		color: #2d3748;
	}

	.assistant-info p {
		font-size: 0.75rem;
		color: #48bb78;
	}

	.btn-clear {
		background: none;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		color: #718096;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-clear:hover {
		background: #fff5f5;
		border-color: #fed7d7;
		color: #c53030;
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.message {
		display: flex;
		gap: 0.75rem;
		max-width: 80%;
	}

	.message.user {
		align-self: flex-end;
		flex-direction: row-reverse;
	}

	.message.assistant {
		align-self: flex-start;
	}

	.message-avatar {
		font-size: 1.25rem;
		flex-shrink: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.message-bubble {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.message-content {
		padding: 0.75rem 1rem;
		border-radius: 12px;
		font-size: 0.9375rem;
		line-height: 1.6;
		white-space: pre-wrap;
	}

	.message.user .message-content {
		background: linear-gradient(135deg, #1a365d, #2b6cb0);
		color: white;
		border-bottom-right-radius: 4px;
	}

	.message.assistant .message-content {
		background: #f7fafc;
		color: #2d3748;
		border: 1px solid #e2e8f0;
		border-bottom-left-radius: 4px;
	}

	.message-time {
		font-size: 0.6875rem;
		color: #a0aec0;
	}

	.message.user .message-time {
		text-align: right;
	}

	/* Typing indicator */
	.typing-indicator {
		padding: 1rem 1.25rem;
		background: #f7fafc;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		border-bottom-left-radius: 4px;
		display: flex;
		gap: 0.375rem;
		align-items: center;
	}

	.typing-indicator span {
		width: 0.5rem;
		height: 0.5rem;
		background: #a0aec0;
		border-radius: 50%;
		animation: bounce 1.2s infinite;
	}

	.typing-indicator span:nth-child(2) {
		animation-delay: 0.2s;
	}

	.typing-indicator span:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes bounce {
		0%, 60%, 100% { transform: translateY(0); }
		30% { transform: translateY(-6px); }
	}

	/* Quick prompts */
	.quick-prompts {
		padding: 0.75rem 1.5rem;
		border-top: 1px solid #e2e8f0;
		background: #f7fafc;
	}

	.quick-prompts p {
		font-size: 0.75rem;
		color: #718096;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	.prompts-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.prompt-chip {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 9999px;
		padding: 0.375rem 0.875rem;
		font-size: 0.8125rem;
		color: #4a5568;
		cursor: pointer;
		transition: all 0.2s;
	}

	.prompt-chip:hover {
		border-color: #4299e1;
		color: #2b6cb0;
		background: #ebf8ff;
	}

	/* Input area */
	.chat-input-area {
		padding: 1rem 1.5rem;
		border-top: 1px solid #e2e8f0;
		display: flex;
		gap: 0.75rem;
		align-items: flex-end;
		background: white;
	}

	.chat-input-area textarea {
		flex: 1;
		padding: 0.75rem 1rem;
		border: 1.5px solid #e2e8f0;
		border-radius: 10px;
		font-size: 0.9375rem;
		resize: none;
		outline: none;
		transition: border-color 0.2s;
		max-height: 120px;
		overflow-y: auto;
	}

	.chat-input-area textarea:focus {
		border-color: #4299e1;
		box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
	}

	.btn-send {
		width: 2.75rem;
		height: 2.75rem;
		background: linear-gradient(135deg, #1a365d, #2b6cb0);
		color: white;
		border: none;
		border-radius: 10px;
		font-size: 1.125rem;
		cursor: pointer;
		transition: opacity 0.2s;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-send:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-send:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.chat-hint {
		padding: 0.375rem 1.5rem 0.75rem;
		font-size: 0.6875rem;
		color: #a0aec0;
		background: white;
		text-align: center;
	}
</style>
