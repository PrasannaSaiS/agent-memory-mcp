import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createMemoryLogger } from '../../src/core/logger.js';

describe('Structured Logger', () => {
  let tmpDir: string;
  let logFilePath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-log-test-'));
    logFilePath = path.join(tmpDir, 'logs.jsonl');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes structured JSON log lines to the log file and never touches stdout', () => {
    const logger = createMemoryLogger({ logFilePath });
    logger.info({ event: 'server_start', version: '0.1.0' }, 'Server initialized');

    expect(fs.existsSync(logFilePath)).toBe(true);
    const lines = fs.readFileSync(logFilePath, 'utf8').trim().split('\n');
    expect(lines.length).toBeGreaterThanOrEqual(1);

    const firstLine = lines[0];
    expect(firstLine).toBeDefined();
    if (!firstLine) throw new Error('No log line written');
    const parsed = JSON.parse(firstLine) as { event?: string; msg?: string; time?: string };
    expect(parsed.event).toBe('server_start');
    expect(parsed.msg).toBe('Server initialized');
    expect(parsed.time).toBeDefined();
  });
});
