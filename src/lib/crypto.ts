/**
 * Password hashing using PBKDF2-SHA256 via Web Crypto API.
 * 100k iterations is the OWASP 2023 minimum for PBKDF2-SHA256.
 *
 * Used by AuthContext for the localStorage-based auth. Sufficient for the
 * demo / single-device usage; if persisting to a real backend later, do
 * password hashing server-side instead.
 */

const ITERATIONS = 100_000
const SALT_BYTES = 16
const HASH_BITS = 256

export interface PasswordRecord {
  algo: 'PBKDF2-SHA256'
  iterations: number
  salt: string
  hash: string
}

export async function hashPassword(password: string): Promise<PasswordRecord> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const hash = await pbkdf2(password, salt, ITERATIONS)
  return {
    algo: 'PBKDF2-SHA256',
    iterations: ITERATIONS,
    salt: bufferToHex(salt),
    hash: bufferToHex(hash),
  }
}

export async function verifyPassword(
  password: string,
  record: PasswordRecord
): Promise<boolean> {
  const salt = hexToBuffer(record.salt)
  const hash = await pbkdf2(password, salt, record.iterations)
  return constantTimeEqual(bufferToHex(hash), record.hash)
}

export function isPasswordRecord(value: unknown): value is PasswordRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as PasswordRecord).algo === 'PBKDF2-SHA256' &&
    typeof (value as PasswordRecord).hash === 'string' &&
    typeof (value as PasswordRecord).salt === 'string'
  )
}

async function pbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<Uint8Array> {
  const enc = new TextEncoder()
  const passwordBytes = enc.encode(password)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBytes as BufferSource,
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    HASH_BITS
  )
  return new Uint8Array(bits)
}

function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}
