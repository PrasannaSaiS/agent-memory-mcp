/**
 * Canonical SHA-256 fingerprinting.
 */

import { createHash } from 'node:crypto';

/**
 * Computes deterministic sha256:<hex> fingerprint from normalized error output.
 */
export function generateFingerprint(normalizedText: string): string {
  const hash = createHash('sha256').update(normalizedText, 'utf8').digest('hex');
  return `sha256:${hash}`;
}
