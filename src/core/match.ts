/**
 * Match Engine: Exact and conservative fuzzy retrieval with explainability.
 * Phase 3 implementation.
 */

import type { MemoryRecord } from '../types.js';

/**
 * Normalizes and extracts the command family (e.g. npm, vitest, cargo, pytest, python, go).
 */
export function extractCommandFamily(command: string): string {
  if (!command) return 'unknown';

  const trimmed = command.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'unknown';

  let bin = parts[0].toLowerCase();
  // Strip path if given as /usr/bin/npm or .\bin\cargo.exe
  bin = bin.replace(/^.*[\\/]/, '').replace(/\.(exe|cmd|bat|sh)$/i, '');

  if (bin === 'npx' || bin === 'bunx' || bin === 'pnpm' || bin === 'yarn') {
    if (parts.length > 1 && parts[1] && !parts[1].startsWith('-')) {
      const sub = parts[1].toLowerCase().replace(/^.*[\\/]/, '');
      return `${bin}:${sub}`;
    }
  }

  if (bin === 'python' || bin === 'python3') {
    const mIndex = parts.indexOf('-m');
    const moduleName = parts[mIndex + 1];
    if (mIndex !== -1 && moduleName) {
      return `python:${moduleName.toLowerCase()}`;
    }
  }

  return bin;
}

/**
 * Calculates Token Jaccard similarity between two normalized strings: |A ∩ B| / |A ∪ B|.
 */
export function calculateTokenJaccard(a: string, b: string): number {
  if (!a && !b) return 1.0;
  if (!a || !b) return 0.0;

  const tokensA = new Set(a.split(/\s+/).filter((t) => t.length > 1));
  const tokensB = new Set(b.split(/\s+/).filter((t) => t.length > 1));

  if (tokensA.size === 0 && tokensB.size === 0) return 1.0;
  if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

  let intersectionCount = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersectionCount++;
    }
  }

  const unionCount = tokensA.size + tokensB.size - intersectionCount;
  return unionCount === 0 ? 0.0 : intersectionCount / unionCount;
}

/**
 * Generates character 3-grams for fine-grained substring/identifier similarity.
 */
function getTrigrams(str: string): Set<string> {
  const trigrams = new Set<string>();
  const clean = str.toLowerCase();
  for (let i = 0; i <= clean.length - 3; i++) {
    trigrams.add(clean.substring(i, i + 3));
  }
  return trigrams;
}

/**
 * Calculates Trigram similarity between two strings: 2 * |A ∩ B| / (|A| + |B|).
 */
export function calculateTrigramSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;
  if (a.length < 3 || b.length < 3) {
    return a === b ? 1.0 : 0.0;
  }

  const triA = getTrigrams(a);
  const triB = getTrigrams(b);

  let common = 0;
  for (const t of triA) {
    if (triB.has(t)) {
      common++;
    }
  }

  return (2.0 * common) / (triA.size + triB.size);
}

/**
 * Composite similarity score combining Token Jaccard (60%) and Trigram similarity (40%).
 * Bounded in [0.0, 1.0].
 */
export function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  const tokenScore = calculateTokenJaccard(a, b);
  const trigramScore = calculateTrigramSimilarity(a, b);
  return Number((0.6 * tokenScore + 0.4 * trigramScore).toFixed(4));
}

/**
 * Formats a human-readable record age from an ISO timestamp.
 */
export function computeRecordAge(createdAt: string, now: Date = new Date()): string {
  const created = new Date(createdAt).getTime();
  const diffMs = Math.max(0, now.getTime() - created);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${String(diffDays)}d ago`;
  if (diffHours > 0) return `${String(diffHours)}h ago`;
  if (diffMin > 0) return `${String(diffMin)}m ago`;
  return `${String(diffSec)}s ago`;
}

/**
 * Evaluates whether a memory record is stale and provides explicit diagnostic reasons.
 */
export function assessStaleness(
  record: MemoryRecord,
  currentNormalizerVersion: number,
  now: Date = new Date(),
): { isStale: boolean; staleReasons: string[] } {
  const staleReasons: string[] = [];

  // 1. Normalizer version drift
  if (record.normalizerVersion < currentNormalizerVersion) {
    staleReasons.push(
      `Normalizer version ${String(record.normalizerVersion)} superseded by current v${String(currentNormalizerVersion)}`,
    );
  }

  // 2. Verification status failed
  if (record.verification.status === 'failed') {
    staleReasons.push('Latest verification failed for this fix');
  }

  // 3. TTL expiry (90 days)
  const created = new Date(record.createdAt).getTime();
  const maxAgeMs = 90 * 24 * 60 * 60 * 1000;
  if (now.getTime() - created > maxAgeMs) {
    staleReasons.push('Record exceeds 90-day TTL freshness threshold');
  }

  return {
    isStale: staleReasons.length > 0,
    staleReasons,
  };
}
