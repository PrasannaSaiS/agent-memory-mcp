import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { JsonlStorage } from '../../src/storage/jsonl.js';
import { SqliteIndex } from '../../src/storage/index.js';
import type { MemoryRecord } from '../../src/types.js';

describe('Storage Reliability & Deterministic Recovery', () => {
  let tmpDir: string;
  let jsonlPath: string;
  let dbPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-reliability-'));
    jsonlPath = path.join(tmpDir, 'records.jsonl');
    dbPath = path.join(tmpDir, 'index.db');
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  function createTestRecord(index: number): MemoryRecord {
    return {
      schemaVersion: 1,
      id: `rec_${index.toString().padStart(3, '0')}`,
      createdAt: new Date(1700000000000 + index * 1000).toISOString(),
      repositoryId: 'test-repo',
      command: `npm test --run-${index}`,
      exitCode: 1,
      rawOutputRedacted: `Failure output for record ${index}`,
      normalizedOutput: `Failure output for record ${index}`,
      fingerprint: `sha256:fp_${index.toString().padStart(3, '0')}`,
      normalizerVersion: 1,
      fix: {
        commands: [`npm run fix-${index}`],
        explanation: `Fix explanation ${index}`,
        risk: 'low',
      },
      environment: {
        os: 'win32',
        node: 'v22.5.0',
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
        author: 'Tester',
        commit: 'abcdef123456',
      },
      supersedes: null,
      tags: ['test'],
      poisoningFlag: null,
    };
  }

  // ─── Item 3.2: Corrupted Line Recovery ──────────────────────────────────────

  it('recovers valid records around a corrupted line and logs structured error to stderr', async () => {
    const lines: string[] = [];
    for (let i = 1; i <= 10; i++) {
      if (i === 5) {
        // Line 5: intentionally truncate mid-JSON
        lines.push('{"id":"rec_005","command":"npm test","incomplete":');
      } else {
        lines.push(JSON.stringify(createTestRecord(i)));
      }
    }
    fs.writeFileSync(jsonlPath, lines.join('\n') + '\n', 'utf8');

    // Intercept stderr to verify structured warning
    const stderrMessages: string[] = [];
    const origStderrWrite = process.stderr.write;
    process.stderr.write = ((chunk: string | Uint8Array) => {
      stderrMessages.push(String(chunk));
      return true;
    }) as typeof process.stderr.write;

    try {
      const jsonl = new JsonlStorage(jsonlPath);
      const records = await jsonl.readAll();

      // Verified: 9 records returned (lines 1-4 and 6-10)
      expect(records.length).toBe(9);
      expect(records[0]?.id).toBe('rec_001');
      expect(records[3]?.id).toBe('rec_004');
      expect(records[4]?.id).toBe('rec_006');
      expect(records[8]?.id).toBe('rec_010');

      // Verified: Line 5 logged as structured error to stderr
      expect(stderrMessages.length).toBe(1);
      const parsedLog = JSON.parse(stderrMessages[0]!);
      expect(parsedLog.event).toBe('jsonl_corrupted_line');
      expect(parsedLog.lineNumber).toBe(5);
      expect(parsedLog.preview).toContain('rec_005');
      expect(parsedLog.recovery).toContain('line skipped; re-run index rebuild');
    } finally {
      process.stderr.write = origStderrWrite;
    }
  });

  // ─── Item 3.3: Index Rebuild Determinism ────────────────────────────────────

  it('rebuilds SQLite index deterministically across consecutive runs', async () => {
    const testRecords = Array.from({ length: 25 }, (_, i) => createTestRecord(i + 1));
    const jsonl = new JsonlStorage(jsonlPath);
    for (const r of testRecords) {
      await jsonl.append(r);
    }

    const records = await jsonl.readAll();
    expect(records.length).toBe(25);

    const sqlite = new SqliteIndex(dbPath);

    try {
      // Rebuild 1
      sqlite.rebuildIndex(records);
      const stats1 = sqlite.getStats();
      const recent1 = sqlite.listRecentIds(50);
      const recordFp1 = sqlite.findByFingerprint('sha256:fp_015');

      // Rebuild 2 on same database instance
      sqlite.rebuildIndex(records);
      const stats2 = sqlite.getStats();
      const recent2 = sqlite.listRecentIds(50);
      const recordFp2 = sqlite.findByFingerprint('sha256:fp_015');

      expect(stats2.total).toBe(stats1.total);
      expect(stats2.exactFingerprints).toBe(stats1.exactFingerprints);
      expect(recent2).toEqual(recent1);
      expect(recordFp2).toEqual(recordFp1);

      // Rebuild on a completely fresh second database file
      const dbPath2 = path.join(tmpDir, 'index-second.db');
      const sqlite2 = new SqliteIndex(dbPath2);
      try {
        sqlite2.rebuildIndex(records);
        const statsFresh = sqlite2.getStats();
        const recentFresh = sqlite2.listRecentIds(50);

        expect(statsFresh.total).toBe(25);
        expect(statsFresh.exactFingerprints).toBe(25);
        expect(recentFresh).toEqual(recent1);
      } finally {
        sqlite2.close();
      }
    } finally {
      sqlite.close();
    }
  });
});
