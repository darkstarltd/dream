
// Minimal zero-knowledge vault using WebCrypto + localStorage as storage backend.
// For production use, replace localStorage with IndexedDB and add secure key-wrapping using OS keystores.

const SALT_KEY = 'ds_vault_salt';
const VAULT_KEY = 'ds_vault_store';

// --- Internal Helper Functions ---

function getPluginSecretKey(pluginId: string, key: string): string {
    return `plugin:${pluginId}:${key}`;
}

async function generateSalt(): Promise<string> {
  const s = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...s));
}

async function importKeyFromPassword(password: string, saltB64: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const pwKey = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' }, pwKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  return key;
}


// --- Public API ---

export async function initVault(password: string): Promise<CryptoKey> {
  let salt = localStorage.getItem(SALT_KEY);
  if (!salt) {
    salt = await generateSalt();
    localStorage.setItem(SALT_KEY, salt);
  }
  const key = await importKeyFromPassword(password, salt);
  return key;
}

export async function encryptVault(key: CryptoKey, data: any): Promise<{ iv: string, ct: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(data)));
  const payload = { iv: btoa(String.fromCharCode(...iv)), ct: btoa(String.fromCharCode(...new Uint8Array(ct))) };
  localStorage.setItem(VAULT_KEY, JSON.stringify(payload));
  return payload;
}

export async function decryptVault(key: CryptoKey): Promise<any> {
  const store = localStorage.getItem(VAULT_KEY);
  if (!store) return {};
  try {
    const { iv: ivb64, ct: ctb64 } = JSON.parse(store);
    const iv = Uint8Array.from(atob(ivb64), c => c.charCodeAt(0));
    const ct = Uint8Array.from(atob(ctb64), c => c.charCodeAt(0));
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    const dec = new TextDecoder();
    return JSON.parse(dec.decode(plain));
  } catch (e) {
    console.error("Decryption failed:", e);
    // This could indicate a wrong password or corrupted data.
    return null;
  }
}

// --- USER-FACING SECRETS (Password Manager) ---

export async function addSecret(key: CryptoKey, id: string, secret: any): Promise<void> {
  const vault = await decryptVault(key) || {};
  vault[id] = secret;
  await encryptVault(key, vault);
}

export async function listSecrets(key: CryptoKey): Promise<{ id: string, item: any }[]> {
  const vault = await decryptVault(key) || {};
  return Object.keys(vault)
    .filter(k => !k.startsWith('plugin:')) // Exclude plugin secrets
    .map(k => ({ id: k, item: vault[k] }));
}

export async function removeSecret(key: CryptoKey, id: string): Promise<void> {
    const vault = await decryptVault(key) || {};
    delete vault[id];
    await encryptVault(key, vault);
}


// --- PLUGIN SECRETS MANAGEMENT ---

export async function storePluginSecret(masterKey: CryptoKey, pluginId: string, secretKey: string, secretValue: string): Promise<void> {
    const vault = await decryptVault(masterKey) || {};
    const namespacedKey = getPluginSecretKey(pluginId, secretKey);
    vault[namespacedKey] = secretValue;
    await encryptVault(masterKey, vault);
}

export async function getPluginSecret(masterKey: CryptoKey, pluginId: string, secretKey: string): Promise<string | null> {
    const vault = await decryptVault(masterKey) || {};
    const namespacedKey = getPluginSecretKey(pluginId, secretKey);
    return vault[namespacedKey] || null;
}

export async function removePluginSecrets(masterKey: CryptoKey, pluginId: string): Promise<void> {
    const vault = await decryptVault(masterKey) || {};
    Object.keys(vault).forEach(key => {
        if (key.startsWith(`plugin:${pluginId}:`)) {
            delete vault[key];
        }
    });
    await encryptVault(masterKey, vault);
}


// Root/jailbreak detection placeholder: actual implementation depends on native layer
export function isDeviceRooted(): boolean {
  // In web build this is always false. In Electron or mobile native wrapper implement detection and expose via window.DS_NATIVE.isRooted
  try { return !!(window as any).DS_NATIVE?.isRooted(); } catch (e) { return false; }
}
