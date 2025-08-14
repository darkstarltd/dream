import * as vaultService from './vaultService';

const API_KEY_SECRET_NAME = 'api_key';

/**
 * Stores an API key for a specific service/plugin in the secure vault.
 * @param masterKey The user's active master CryptoKey.
 * @param serviceId A unique identifier for the service (e.g., a plugin ID).
 * @param apiKey The API key to store.
 */
export async function storeApiKey(masterKey: CryptoKey, serviceId: string, apiKey: string): Promise<void> {
    await vaultService.storePluginSecret(masterKey, serviceId, API_KEY_SECRET_NAME, apiKey);
}

/**
 * Retrieves an API key for a specific service/plugin from the secure vault.
 * @param masterKey The user's active master CryptoKey.
 * @param serviceId A unique identifier for the service (e.g., a plugin ID).
 * @returns The stored API key, or null if not found.
 */
export async function getApiKey(masterKey: CryptoKey, serviceId: string): Promise<string | null> {
    return await vaultService.getPluginSecret(masterKey, serviceId, API_KEY_SECRET_NAME);
}
