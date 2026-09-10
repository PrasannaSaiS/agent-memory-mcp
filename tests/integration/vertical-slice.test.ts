import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { MemoryService } from '../../src/core/memoryService.js';

describe('Vertical Slice Integration: record_failure and find_fix', () => {
  let tmpDir: string;
  let memoryDir: string;
  let service: MemoryService;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-vertical-'));
    memoryDir = path.join(tmpDir, '.agent-memory');
    fs.mkdirSync(memoryDir, { recursive: true });

    service = new MemoryService({
      memoryDir,
      repositoryId: 'integration-test-repo',
    });
  });

  afterEach(() => {
    service.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('records a failure and retrieves the fix by exact fingerprint match', async () => {
    const rawError = `
      Error: Cannot find module '@modelcontextprotocol/sdk'
      at Function.Module._resolveFilename (node:internal/modules/cjs/loader:1225:15)
      at line 45 with token ghp_ABC123secretToken456
    `;

    // 1. Record failure
    const recordResult = await service.recordFailure({
      command: 'npm test',
      exitCode: 1,
      output: rawError,
      fixCommands: ['npm install @modelcontextprotocol/sdk'],
      explanation: 'Missing dependency in package.json',
      risk: 'low',
      tags: ['npm', 'deps'],
    });

    expect(recordResult.status).toBe('recorded');
    expect(recordResult.id).toBeDefined();
    expect(recordResult.fingerprint).toMatch(/^sha256:[a-f0-9]{64}$/);

    // 2. Verify files written
    const jsonlPath = path.join(memoryDir, 'records.jsonl');
    const logsPath = path.join(memoryDir, 'logs.jsonl');
    const dbPath = path.join(memoryDir, 'index.db');

    expect(fs.existsSync(jsonlPath)).toBe(true);
    expect(fs.existsSync(logsPath)).toBe(true);
    expect(fs.existsSync(dbPath)).toBe(true);

    // Verify secret was redacted before persistence
    const jsonlContent = fs.readFileSync(jsonlPath, 'utf8');
    expect(jsonlContent).not.toContain('ghp_ABC123secretToken456');
    expect(jsonlContent).toContain('[REDACTED_GITHUB_TOKEN]');

    // 3. Find fix with matching error trace
    const findResult = await service.findFix({
      command: 'npm test',
      output: rawError,
    });

    expect(findResult.retrievalCount).toBe(1);
    expect(findResult.matches.length).toBe(1);

    const match = findResult.matches[0];
    expect(match).toBeDefined();
    if (!match) throw new Error('Expected match');
    expect(match.matchType).toBe('exact');
    expect(match.similarityScore).toBe(1.0);
    expect(match.fix.commands).toEqual(['npm install @modelcontextprotocol/sdk']);
    expect(match.sanitizationEnvelope).toContain('<untrusted_historical_memory');
    expect(match.sanitizationEnvelope).toContain('Missing dependency in package.json');
  });

  it('rejects invalid inputs failing Zod validation', async () => {
    await expect(
      service.recordFailure({
        command: '', // invalid: empty command
        exitCode: 1,
        output: 'some error',
        fixCommands: [],
        explanation: '',
      }),
    ).rejects.toThrow();
  });
});
