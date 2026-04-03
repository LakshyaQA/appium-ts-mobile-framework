/**
 * © 2026 Lakshya Sharma (LakshyaQA)
 * Repository: https://github.com/LakshyaQA/appium-ts-mobile-framework
 *
 * PROPRIETARY & CONFIDENTIAL:
 * Unauthorized cloning, modification, or distribution of this Software,
 * in whole or in part, via any medium is strictly prohibited.
 *
 * All rights reserved by Lakshya Sharma.
 */

// ...existing code...
export function generateSequentialEmail(): string {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `user_${uuid}@test.com`;
}
// ...existing code...

// Persist and retrieve signup emails by "tag"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const STORE_DIR = join(process.cwd(), '.wdio-cache');
const STORE_FILE = join(STORE_DIR, 'saved-emails.json');

function ensureStore(): void {
  if (!existsSync(STORE_DIR)) mkdirSync(STORE_DIR, { recursive: true });
  if (!existsSync(STORE_FILE)) writeFileSync(STORE_FILE, JSON.stringify({}, null, 2), 'utf-8');
}

function loadStore(): Record<string, string> {
  ensureStore();
  try {
    const raw = readFileSync(STORE_FILE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

function saveStore(store: Record<string, string>): void {
  ensureStore();
  writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

/**
 * Save the email under a tag (e.g., "signup_user1")
 */
export function saveEmail(tag: string, email: string): void {
  const store = loadStore();
  store[tag] = email;
  saveStore(store);
}

/**
 * Get a previously saved email by tag, or null if not found
 */
export function getSavedEmail(tag: string): string | null {
  const store = loadStore();
  return store[tag] ?? null;
}

/**
 * Remove a saved email by tag
 */
export function clearSavedEmail(tag: string): void {
  const store = loadStore();
  if (tag in store) {
    delete store[tag];
    saveStore(store);
  }
}

/**
 * Generate an email and save it under the provided tag
 */
export function generateSequentialEmailWithTag(tag: string): string {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `user_${uuid}@test.com`;
  saveEmail(tag, email);
  return email;
}

/**
 * Use saved email by tag if present; otherwise generate and save a new one
 */
export function useSavedOrGenerate(tag: string): string {
  const existing = getSavedEmail(tag);
  if (existing) return existing;
  return generateSequentialEmailWithTag(tag);
}
