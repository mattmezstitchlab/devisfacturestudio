import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getRandomBytes } from 'expo-crypto';
import { gcm } from '@noble/ciphers/aes';
import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';
import { Database, Profile, emptyDb, seedDb } from './model';
import provisioning from './provision.json';
const STORE = 'matt-mez.studio.vault.v1';
const DEMO = 'matt-mez.studio.demo.v1';
type Envelope = { salt: string; nonce: string; ciphertext: string; revision: number; version: 1 };
export type Key = { bytes: Uint8Array; salt: string };
export const hasVault = async () => !!(await AsyncStorage.getItem(STORE));
async function derive(password: string, salt: string) {
  if (Platform.OS === 'web' && globalThis.crypto?.subtle) {
    const base = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits'],
    );
    return new Uint8Array(
      await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: new Uint8Array(hexToBytes(salt)),
          iterations: 600000,
          hash: 'SHA-256',
        },
        base,
        256,
      ),
    );
  }
  return await pbkdf2Async(sha256, utf8ToBytes(password), hexToBytes(salt), {
    c: 600000,
    dkLen: 32,
    asyncTick: 12,
  });
}
export async function openVault(password: string) {
  const raw = await AsyncStorage.getItem(STORE);
  if (!raw) throw new Error('Aucun espace privé sur cet appareil.');
  const e: Envelope = JSON.parse(raw);
  const bytes = await derive(password, e.salt);
  try {
    const plain = gcm(bytes, hexToBytes(e.nonce)).decrypt(hexToBytes(e.ciphertext));
    const db = JSON.parse(new TextDecoder().decode(plain));
    if (db.version !== 1) throw new Error();
    return { db: db as Database, key: { bytes, salt: e.salt } };
  } catch {
    bytes.fill(0);
    throw new Error('Mot de passe incorrect ou sauvegarde illisible.');
  }
}
export async function saveVault(db: Database, key: Key, previous: number) {
  const save = async () => {
    const raw = await AsyncStorage.getItem(STORE);
    if (raw && JSON.parse(raw).revision !== previous)
      throw new Error(
        'Le coffre a été modifié dans un autre onglet. Verrouillez puis rouvrez votre espace.',
      );
    if (!raw && previous !== -1)
      throw new Error('Le coffre n’existe plus. Rechargez votre espace.');
    const nonce = getRandomBytes(12);
    const ciphertext = gcm(key.bytes, nonce).encrypt(utf8ToBytes(JSON.stringify(db)));
    const e: Envelope = {
      salt: key.salt,
      nonce: bytesToHex(nonce),
      ciphertext: bytesToHex(ciphertext),
      revision: db.revision,
      version: 1,
    };
    await AsyncStorage.setItem(STORE, JSON.stringify(e));
  };
  if (Platform.OS === 'web' && navigator.locks)
    await navigator.locks.request('mattmez-write', save);
  else await save();
}
export async function createVault(password: string, activation: string) {
  if (await hasVault()) throw new Error('Un coffre existe déjà. Déverrouillez-le.');
  if (password.length < 10) throw new Error('Choisissez au moins 10 caractères.');
  const code = activation.replace(/[\s-]/g, '').toUpperCase();
  if (code.length !== 24)
    throw new Error('Saisissez le code d’initialisation privé fourni avec votre studio.');
  const setupKey = await derive(code, provisioning.salt);
  let initial: { profile: Profile; client: { address: string; email: string } };
  try {
    initial = JSON.parse(
      new TextDecoder().decode(
        gcm(setupKey, hexToBytes(provisioning.nonce)).decrypt(hexToBytes(provisioning.ciphertext)),
      ),
    );
  } catch {
    throw new Error('Code d’initialisation incorrect.');
  } finally {
    setupKey.fill(0);
  }
  const salt = bytesToHex(getRandomBytes(16)),
    key = { bytes: await derive(password, salt), salt },
    db = emptyDb();
  db.profile = initial.profile;
  const demo = seedDb(),
    example = demo.bookings.find((b) => b.sample)!;
  const contact = demo.clients.find((c) => c.id === example.clientId)!;
  Object.assign(contact, initial.client);
  db.clients.push(contact);
  db.bookings.push(example);
  await saveVault(db, key, -1);
  return { db, key };
}
export async function readUnlockedVault(key: Key): Promise<Database> {
  const raw = await AsyncStorage.getItem(STORE);
  if (!raw) throw new Error('Le coffre a été supprimé sur cet appareil.');
  const e: Envelope = JSON.parse(raw);
  if (e.salt !== key.salt) throw new Error('Le coffre a changé. Déverrouillez-le de nouveau.');
  return JSON.parse(
    new TextDecoder().decode(gcm(key.bytes, hexToBytes(e.nonce)).decrypt(hexToBytes(e.ciphertext))),
  );
}
export async function eraseVault() {
  await AsyncStorage.removeItem(STORE);
}
export function loadDemo(): Database | null {
  try {
    if (Platform.OS === 'web') {
      const s = sessionStorage.getItem(DEMO);
      return s ? JSON.parse(s) : null;
    }
  } catch {}
  return null;
}
export function saveDemo(db: Database) {
  if (Platform.OS === 'web') sessionStorage.setItem(DEMO, JSON.stringify(db));
}
export function clearDemo() {
  if (Platform.OS === 'web') sessionStorage.removeItem(DEMO);
}
export const themeStorage = {
  read: () => AsyncStorage.getItem('mattmez.theme'),
  write: (s: string) => AsyncStorage.setItem('mattmez.theme', s),
};
export async function encryptedBackup() {
  const raw = await AsyncStorage.getItem(STORE);
  if (!raw) throw new Error('Aucun coffre enregistré.');
  return raw;
}
export async function restoreBackup(text: string, password: string) {
  if (await hasVault()) throw new Error('La restauration est réservée à un appareil sans coffre.');
  const e: Envelope = JSON.parse(text);
  if (e.version !== 1 || !e.salt || !e.nonce || !e.ciphertext || e.ciphertext.length > 60000000)
    throw new Error('Fichier de sauvegarde invalide.');
  const bytes = await derive(password, e.salt);
  let db: Database;
  try {
    db = JSON.parse(
      new TextDecoder().decode(gcm(bytes, hexToBytes(e.nonce)).decrypt(hexToBytes(e.ciphertext))),
    );
    if (db.version !== 1 || !Array.isArray(db.bookings) || !Array.isArray(db.docs))
      throw new Error();
  } catch {
    throw new Error('Mot de passe ou sauvegarde incorrect.');
  }
  await AsyncStorage.setItem(STORE, JSON.stringify(e));
  return { db, key: { bytes, salt: e.salt } };
}
