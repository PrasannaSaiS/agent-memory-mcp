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

  it('readAll returns empty array when file does not exist', async () => {
    const nonExistentPath = path.join(tmpDir, 'nonexistent', 'records.jsonl');
    const jsonl = new JsonlStorage(nonExistentPath);
    const records = await jsonl.readAll();
    expect(records).toEqual([]);
  });

  it('readAll retrieves all valid records from JSONL', async () => {
    const jsonl = new JsonlStorage(jsonlPath);
    await jsonl.append(mockRecord);
    const secondRecord = { ...mockRecord, id: 'rec_456' };
    await jsonl.append(secondRecord);

    const records = await jsonl.readAll();
    expect(records.length).toBe(2);
    expect(records[0]?.id).toBe('rec_123');
    expect(records[1]?.id).toBe('rec_456');
  });

  it('readAll handles corrupted JSONL lines by skipping and warning on stderr', async () => {
    const jsonl = new JsonlStorage(jsonlPath);
    await jsonl.append(mockRecord);

    // Corrupt line in between
    fs.appendFileSync(jsonlPath, '{"broken json line without closing bracket\n', 'utf8');

    const thirdRecord = { ...mockRecord, id: 'rec_789' };
    await jsonl.append(thirdRecord);

    let stderrOutput = '';
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const origStderrWrite = process.stderr.write;
    process.stderr.write = ((chunk: string | Uint8Array) => {
      stderrOutput += String(chunk);
      return true;
    }) as typeof process.stderr.write;

    try {
      const records = await jsonl.readAll();
      expect(records.length).toBe(2);
      expect(records[0]?.id).toBe('rec_123');
      expect(records[1]?.id).toBe('rec_789');
      expect(stderrOutput).toContain('jsonl_corrupted_line');
    } finally {
      process.stderr.write = origStderrWrite;
    }
  });

  it('handles concurrent writers without data loss or corruption (Windows/POSIX)', async () => {
    const jsonl = new JsonlStorage(jsonlPath);
    const writeCount = 25;
    const promises = Array.from({ length: writeCount }, (_, i) => {
      const rec: MemoryRecord = {
        ...mockRecord,
        id: 'rec_concurrent_' + String(i),
        fingerprint: 'sha256:fingerprint_' + String(i),
      };
      return jsonl.append(rec);
    });

    await Promise.all(promises);

    const records = await jsonl.readAll();
    expect(records.length).toBe(writeCount);
    const ids = new Set(records.map((r) => r.id));
    expect(ids.size).toBe(writeCount);
  });
});
