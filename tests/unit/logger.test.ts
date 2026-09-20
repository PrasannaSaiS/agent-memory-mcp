import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createMemoryLogger, rotateLogFileIfNeeded } from '../../src/core/logger.js';

describe('Structured Logger & Log Rotation', () => {
  let tmpDir: string;
  let logFilePath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-log-test-'));
    logFilePath = path.join(tmpDir, 'logs.jsonl');
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it('writes structured JSON log lines with ISO timestamp and context fields', () => {
    const logger = createMemoryLogger({ logFilePath });
    logger.info(
      {
        event: 'record_failure_success',
        id: 'rec_test_123',
        fingerprint: 'sha256:abc123',
        status: 'recorded',
      },
      'Recorded failure rec_test_123',
    );

    expect(fs.existsSync(logFilePath)).toBe(true);
    const lines = fs.readFileSync(logFilePath, 'utf8').trim().split('\n');
    expect(lines.length).toBeGreaterThanOrEqual(1);

    const firstLine = lines[0]!;
    const parsed = JSON.parse(firstLine);
    expect(parsed.event).toBe('record_failure_success');
    expect(parsed.id).toBe('rec_test_123');
    expect(parsed.fingerprint).toBe('sha256:abc123');
    expect(parsed.level).toBe(30); // Pino info level
    expect(parsed.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO-8601
    expect(parsed.msg).toBe('Recorded failure rec_test_123');
  });

  it('redacts sensitive fields like token, apiKey, and password from structured logs', () => {
    const logger = createMemoryLogger({ logFilePath });
    logger.info(
      {
        event: 'auth_attempt',
        apiKey: 'super-secret-api-key-12345',
        password: 'mySecretPassword!',
      },
      'User login attempted',
    );

    const content = fs.readFileSync(logFilePath, 'utf8');
    expect(content).not.toContain('super-secret-api-key-12345');
    expect(content).not.toContain('mySecretPassword!');
    expect(content).toContain('[REDACTED_SECRET]');
  });

  it('rotates log file when size exceeds maxLogSizeBytes', () => {
    // Write 1 KB of initial log data
    const initialData = 'x'.repeat(1024) + '\n';
    fs.writeFileSync(logFilePath, initialData, 'utf8');

    // Call rotation with threshold 500 bytes
    const rotated = rotateLogFileIfNeeded(logFilePath, 500);
    expect(rotated).toBe(true);

    const backupPath = logFilePath + '.1';
    expect(fs.existsSync(backupPath)).toBe(true);
    expect(fs.readFileSync(backupPath, 'utf8')).toBe(initialData);

    // Initial log file is moved; logger can now create fresh logs.jsonl
    const logger = createMemoryLogger({ logFilePath, maxLogSizeBytes: 500 });
    logger.info({ event: 'fresh_log_entry' }, 'New log after rotation');

    expect(fs.existsSync(logFilePath)).toBe(true);
    const freshContent = fs.readFileSync(logFilePath, 'utf8');
    expect(freshContent).toContain('fresh_log_entry');
    expect(freshContent).not.toContain(initialData);
  });
});
