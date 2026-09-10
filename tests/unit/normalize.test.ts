import { describe, it, expect } from 'vitest';
import { normalizeOutput, CURRENT_NORMALIZER_VERSION } from '../../src/core/normalize.js';

describe('normalizeOutput', () => {
  it('replaces timestamps and ISO date strings', () => {
    const raw = '2026-09-10T10:55:00.123Z [ERROR] Build failed at 10:55:00';
    const norm = normalizeOutput(raw);
    expect(norm).not.toContain('2026-09-10T10:55:00.123Z');
    expect(norm).toContain('<TIMESTAMP>');
  });

  it('replaces UUIDs and GUIDs', () => {
    const raw = 'Task e8d1c920-5f21-4d32-84fc-92a11b0e3f4a timed out';
    const norm = normalizeOutput(raw);
    expect(norm).not.toContain('e8d1c920-5f21-4d32-84fc-92a11b0e3f4a');
    expect(norm).toContain('<UUID>');
  });

  it('replaces memory addresses and hexadecimal pointers', () => {
    const raw = 'SIGSEGV fault at address 0x7fff5fbff8a0 in thread 0x1a2b';
    const norm = normalizeOutput(raw);
    expect(norm).not.toContain('0x7fff5fbff8a0');
    expect(norm).toContain('<HEX_ADDR>');
  });

  it('replaces absolute temporary directory paths', () => {
    const raw = 'Error in C:\\Users\\prasa\\AppData\\Local\\Temp\\test-run\\file.ts';
    const norm = normalizeOutput(raw);
    expect(norm).toContain('<TMP_DIR>');
  });

  it('exports CURRENT_NORMALIZER_VERSION as an integer >= 1', () => {
    expect(CURRENT_NORMALIZER_VERSION).toBeGreaterThanOrEqual(1);
  });
});
