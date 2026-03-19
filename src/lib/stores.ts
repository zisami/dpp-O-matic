import { writable } from 'svelte/store';
import type { ChatMessage } from './types';

export const chatMessages = writable<ChatMessage[]>([]);
export const isLoadingAI = writable(false);
export const sidebarOpen = writable(false);

export function addMessage(role: 'user' | 'assistant', content: string) {
	chatMessages.update((messages) => [
		...messages,
		{
			id: crypto.randomUUID(),
			role,
			content,
			timestamp: new Date()
		}
	]);
}

export function clearChat() {
	chatMessages.set([]);
}
