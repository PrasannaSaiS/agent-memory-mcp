import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { MemoryService } from '../../src/core/memoryService.js';
import { normalizeOutput } from '../../src/core/normalize.js';
import { generateFingerprint } from '../../src/core/fingerprint.js';

describe('Adversarial Normalization & Retrieval Fixtures', () => {
  let tmpDir: string;
  let memoryDir: string;
  let service: MemoryService;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-adv-'));
    memoryDir = path.join(tmpDir, '.agent-memory');
    fs.mkdirSync(memoryDir, { recursive: true });
    service = new MemoryService({ memoryDir, repositoryId: 'adversarial-repo' });
  });

  afterEach(() => {
    service.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('under-normalization fixture: catches semantically identical crash across line-number shifts via conservative fuzzy fallback', async () => {
    // Failure recorded during session 1
    const errorRun1 = `
      Error: ConfigValidationError: Missing required configuration key 'DATABASE_PORT'
      at validateConfig (src/config/loader.ts:142:11)
      at initDatabase (src/db/connection.ts:45:9)
    `;

    await service.recordFailure({
      command: 'npm test',
      exitCode: 1,
      output: errorRun1,
      fixCommands: ['export DATABASE_PORT=5432'],
      explanation: 'Set DATABASE_PORT environment variable before running database init',
    });

    // Later session: code refactored, line numbers shifted by 10 lines
    const errorRun2 = `
      Error: ConfigValidationError: Missing required configuration key 'DATABASE_PORT'
      at validateConfig (src/config/loader.ts:152:11)
      at initDatabase (src/db/connection.ts:55:9)
    `;

    // Exact fingerprint differs due to unnormalized line numbers
    const fp1 = generateFingerprint(normalizeOutput(errorRun1));
    const fp2 = generateFingerprint(normalizeOutput(errorRun2));
    expect(fp1).not.toBe(fp2);

    // But findFix conservative fuzzy fallback retrieves the fix with high similarity
    const result = await service.findFix({
      command: 'npm test',
      output: errorRun2,
      threshold: 0.65,
    });

    expect(result.retrievalCount).toBe(1);
    const match = result.matches[0];
    expect(match).toBeDefined();
    if (!match) throw new Error('Expected fuzzy match');

    expect(match.matchType).toBe('fuzzy');
    expect(match.similarityScore).toBeGreaterThan(0.75);
    expect(match.fix.commands).toEqual(['export DATABASE_PORT=5432']);
    // Verify it is NEVER silently promoted to exact
    expect(match.matchType).not.toBe('exact');
  });

  it('over-normalization fixture: does NOT conflate distinct error keys/types into identical fingerprints', async () => {
    const errorAuth = `TypeError: Cannot read properties of undefined (reading 'authProvider') in src/server.ts`;
    const errorDb = `TypeError: Cannot read properties of undefined (reading 'databasePool') in src/server.ts`;

    const fpAuth = generateFingerprint(normalizeOutput(errorAuth));
    const fpDb = generateFingerprint(normalizeOutput(errorDb));

    // Must preserve distinct semantic tokens
    expect(fpAuth).not.toBe(fpDb);

    // Record auth fix
    await service.recordFailure({
      command: 'npm run start',
      exitCode: 1,
      output: errorAuth,
      fixCommands: ['npm run setup:auth'],
      explanation: 'Initialize auth provider',
    });

    // Query with db failure
    const result = await service.findFix({
      command: 'npm run start',
      output: errorDb,
      threshold: 0.85, // strict threshold
    });

    // Since they are distinct bugs, strict threshold does not conflate them
    expect(result.matches.find((m) => m.matchType === 'exact')).toBeUndefined();
  });

  it('command family isolation: rejects matches from incompatible toolchains even with identical error text', async () => {
    const commonError = 'Error: connection refused 127.0.0.1:8080';

    // Record under cargo
    await service.recordFailure({
      command: 'cargo test',
      exitCode: 101,
      output: commonError,
      fixCommands: ['cargo build --features mock'],
      explanation: 'Enable mock server in cargo',
    });

    // Query under npm
    const result = await service.findFix({
      command: 'npm test',
      output: commonError,
    });

    // Incompatible command family (cargo vs npm) must not match
    expect(result.retrievalCount).toBe(0);
  });
});
