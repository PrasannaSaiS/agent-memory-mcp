import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { JsonlStorage } from '../../src/storage/jsonl.js';
import { SqliteIndex } from '../../src/storage/index.js';
import type { MemoryRecord } from '../../src/types.js';

describe('Storage and Indexing', () => {
  let tmpDir: string;
  let jsonlPath: string;
  let dbPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-test-'));
    jsonlPath = path.join(tmpDir, 'records.jsonl');
    dbPath = path.join(tmpDir, 'index.db');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const mockRecord: MemoryRecord = {
    schemaVersion: 1,
    id: 'rec_123',
    createdAt: new Date().toISOString(),
    repositoryId: 'test-repo',
    command: 'npm test',
    exitCode: 1,
    rawOutputRedacted: 'Test failed',
    normalizedOutput: 'Test failed',
    fingerprint: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    normalizerVersion: 1,
    fix: {
      commands: ['npm install vitest'],
      explanation: 'Install missing vitest',
      risk: 'low',
    },
    environment: {
      os: 'win32',
      node: 'v22.0.0',
      packageManager: 'npm',
      lockfileHashes: {},
    },
    verification: {
      status: 'unknown',
      verifiedAt: null,
      method: 'dry_run',
      wilsonLowerBound: null,
    },
    provenance: {
      author: 'Tester <tester@example.com>',
      commit: null,
    },
    supersedes: null,
    tags: ['test'],
    poisoningFlag: null,
  };

  it('appends records atomically to JSONL', async () => {
    const jsonl = new JsonlStorage(jsonlPath);
    await jsonl.append(mockRecord);

    const content = fs.readFileSync(jsonlPath, 'utf8').trim();
    const parsed = JSON.parse(content) as { id?: string };
    expect(parsed.id).toBe('rec_123');
  });

  it('indexes records in SQLite and retrieves exact match by fingerprint', () => {
    const sqlite = new SqliteIndex(dbPath);
    sqlite.indexRecord(mockRecord);

    const found = sqlite.findByFingerprint(mockRecord.fingerprint);
    expect(found).not.toBeNull();
    expect(found?.id).toBe('rec_123');
    expect(found?.command).toBe('npm test');
    sqlite.close();
  });
});
