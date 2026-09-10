import { describe, it, expect } from 'vitest';
import {
  extractCommandFamily,
  calculateSimilarity,
  computeRecordAge,
  assessStaleness,
} from '../../src/core/match.js';
import type { MemoryRecord } from '../../src/types.js';

describe('extractCommandFamily', () => {
  it('extracts primary binary or tool suite', () => {
    expect(extractCommandFamily('npm test')).toBe('npm');
    expect(extractCommandFamily('npm run build')).toBe('npm');
    expect(extractCommandFamily('npx vitest run')).toBe('npx:vitest');
    expect(extractCommandFamily('pnpm test')).toBe('pnpm:test');
    expect(extractCommandFamily('cargo test --lib')).toBe('cargo');
    expect(extractCommandFamily('pytest tests/unit')).toBe('pytest');
    expect(extractCommandFamily('python -m pytest')).toBe('python:pytest');
    expect(extractCommandFamily('/usr/local/bin/npm test')).toBe('npm');
  });
});

describe('calculateSimilarity', () => {
  it('returns 1.0 for identical strings', () => {
    const error = 'TypeError: Cannot read property of undefined at line 42';
    expect(calculateSimilarity(error, error)).toBe(1.0);
  });

  it('returns high similarity (>0.75) for minor variations of the same error', () => {
    const errA =
      'Error: Cannot find module @modelcontextprotocol/sdk at Function.Module._resolveFilename';
    const errB =
      'Error: Cannot find module @modelcontextprotocol/sdk at Function.Module._resolveFilename in loader.js';
    const score = calculateSimilarity(errA, errB);
    expect(score).toBeGreaterThan(0.75);
    expect(score).toBeLessThanOrEqual(1.0);
  });

  it('returns low similarity (<0.5) for completely different error messages', () => {
    const errA = 'TypeError: Cannot read properties of undefined';
    const errB = 'ConnectionRefusedError: connect ECONNREFUSED 127.0.0.1:5432';
    const score = calculateSimilarity(errA, errB);
    expect(score).toBeLessThan(0.5);
  });
});

describe('computeRecordAge', () => {
  it('formats human readable age', () => {
    const now = new Date('2026-09-10T12:00:00.000Z');
    const created10mAgo = new Date('2026-09-10T11:50:00.000Z').toISOString();
    const created2hAgo = new Date('2026-09-10T10:00:00.000Z').toISOString();
    const created5dAgo = new Date('2026-09-05T12:00:00.000Z').toISOString();

    expect(computeRecordAge(created10mAgo, now)).toBe('10m ago');
    expect(computeRecordAge(created2hAgo, now)).toBe('2h ago');
    expect(computeRecordAge(created5dAgo, now)).toBe('5d ago');
  });
});

describe('assessStaleness', () => {
  const baseRecord: MemoryRecord = {
    schemaVersion: 1,
    id: 'rec_1',
    createdAt: new Date().toISOString(),
    repositoryId: 'test',
    command: 'npm test',
    exitCode: 1,
    rawOutputRedacted: '',
    normalizedOutput: '',
    fingerprint: 'sha256:123',
    normalizerVersion: 1,
    fix: { commands: [], explanation: '', risk: 'low' },
    environment: { os: 'win32', node: 'v22', packageManager: 'npm', lockfileHashes: {} },
    verification: { status: 'passed', verifiedAt: null, method: 'dry_run', wilsonLowerBound: 0.9 },
    provenance: { author: 'dev', commit: null },
    supersedes: null,
    tags: [],
    poisoningFlag: null,
  };

  it('flags normalizer version drift', () => {
    const record = { ...baseRecord, normalizerVersion: 1 };
    const evaluation = assessStaleness(record, 2);
    expect(evaluation.isStale).toBe(true);
    expect(evaluation.staleReasons[0]).toContain('Normalizer version 1 superseded');
  });

  it('flags failed verification status', () => {
    const record: MemoryRecord = {
      ...baseRecord,
      verification: { ...baseRecord.verification, status: 'failed' },
    };
    const evaluation = assessStaleness(record, 1);
    expect(evaluation.isStale).toBe(true);
    expect(evaluation.staleReasons).toContain('Latest verification failed for this fix');
  });

  it('returns clean freshness for up-to-date verified record', () => {
    const evaluation = assessStaleness(baseRecord, 1);
    expect(evaluation.isStale).toBe(false);
    expect(evaluation.staleReasons.length).toBe(0);
  });
});
