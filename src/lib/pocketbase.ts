import PocketBase from 'pocketbase';
import { writable } from 'svelte/store';
import type { AuthModel } from 'pocketbase';

export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL ?? 'http://127.0.0.1:8090');

export const currentUser = writable<AuthModel>(pb.authStore.record);

pb.authStore.onChange((_, record) => {
	currentUser.set(record);
});

export async function login(email: string, password: string) {
	return await pb.collection('users').authWithPassword(email, password);
}

export async function register(
	email: string,
	password: string,
	name: string
) {
	const user = await pb.collection('users').create({
		email,
		password,
		passwordConfirm: password,
		name
	});
	await login(email, password);
	return user;
}

export function logout() {
	pb.authStore.clear();
}

export async function uploadFile(collectionName: string, recordId: string, file: File) {
	const formData = new FormData();
	formData.append('file', file);
	return await pb.collection(collectionName).update(recordId, formData);
}

export async function createDppRecord(data: Record<string, unknown> | FormData) {
	return await pb.collection('dpp_records').create(data);
}

export async function getDppRecords() {
	return await pb.collection('dpp_records').getList(1, 50, {
		sort: '-created'
	});
}

export async function getDppRecord(id: string) {
	return await pb.collection('dpp_records').getOne(id);
}

export async function updateDppRecord(id: string, data: Record<string, unknown>) {
	return await pb.collection('dpp_records').update(id, data);
}

export async function deleteDppRecord(id: string) {
	return await pb.collection('dpp_records').delete(id);
}
