/**
 * Staleness Evaluation and Wilson Score Lower Bound.
 * Phase 4 implementation.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type { MemoryRecord } from '../types.js';

const KNOWN_LOCKFILES = [
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
  'Cargo.lock',
  'poetry.lock',
  'requirements.txt',
  'go.sum',
];

/**
 * Computes SHA-256 hashes for all lockfiles present in the workspace.
 */
export function getLockfileHashes(workspaceRoot: string): Record<string, string> {
  const hashes: Record<string, string> = {};

  for (const filename of KNOWN_LOCKFILES) {
    const fullPath = path.join(workspaceRoot, filename);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath);
        const hash = createHash('sha256').update(content).digest('hex');
        hashes[filename] = `sha256:${hash}`;
      } catch {
        // Skip unreadable files
      }
    }
  }

  return hashes;
}

/**
 * Computes the Wilson-score lower bound for binomial proportion confidence interval.
 * Returns null if total trials is 0.
 */
export function calculateWilsonScoreLowerBound(
  successes: number,
  total: number,
  z = 1.96, // 95% confidence
): number | null {
  if (total <= 0 || successes < 0 || successes > total) {
    return null;
  }

  const p = successes / total;
  const z2 = z * z;
  const denominator = 1 + z2 / total;
  const center = p + z2 / (2 * total);
  const spread = z * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total);

  const lowerBound = Math.max(0, (center - spread) / denominator);
  return Number(lowerBound.toFixed(4));
}

/**
 * Checks a memory record for staleness:
 * - Lockfile hash drift
 * - Normalizer version mismatch
 * - Verification failure or low Wilson score
 * - TTL expiration (90 days)
 */
export function checkRecordStaleness(
  record: MemoryRecord,
  workspaceRoot: string,
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

  // 2. Lockfile hash drift
  const currentHashes = getLockfileHashes(workspaceRoot);
  for (const [lockfile, recordedHash] of Object.entries(record.environment.lockfileHashes)) {
    const currentHash = currentHashes[lockfile];
    if (!currentHash) {
      staleReasons.push(`Lockfile ${lockfile} no longer exists in workspace`);
    } else if (currentHash !== recordedHash) {
      staleReasons.push(`Lockfile ${lockfile} has changed since record was created`);
    }
  }

  // 3. Verification status
  if (record.verification.status === 'failed') {
    staleReasons.push('Latest verification failed for this fix');
  } else if (
    record.verification.wilsonLowerBound !== null &&
    record.verification.wilsonLowerBound < 0.4
  ) {
    staleReasons.push(
      `Low verification confidence score (Wilson lower bound: ${String(record.verification.wilsonLowerBound)})`,
    );
  }

  // 4. TTL expiration (90 days)
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
