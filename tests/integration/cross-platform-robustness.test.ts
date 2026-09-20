import { describe, it, expect } from 'vitest';
import { normalizeOutput } from '../../src/core/normalize.js';
import { generateFingerprint } from '../../src/core/fingerprint.js';
import { checkNodeVersion } from '../../src/server.js';

describe('Cross-Platform & Environment Robustness', () => {
  // ─── Item 5.1: Path Separator Normalization ─────────────────────────────────

  it('produces identical fingerprints for equivalent Windows and POSIX path error traces', () => {
    const windowsTrace = `
      src\\components\\AuthModal.tsx:42:15 - error TS2322: Type 'string' is not assignable to type 'number'.
      at Object.render (src\\components\\AuthModal.tsx:42:15)
      at mountComponent (node_modules\\react-dom\\cjs\\react-dom.development.js:1498:12)
    `;

    const posixTrace = `
      src/components/AuthModal.tsx:42:15 - error TS2322: Type 'string' is not assignable to type 'number'.
      at Object.render (src/components/AuthModal.tsx:42:15)
      at mountComponent (node_modules/react-dom/cjs/react-dom.development.js:1498:12)
    `;

    const normWindows = normalizeOutput(windowsTrace);
    const normPosix = normalizeOutput(posixTrace);

    expect(normWindows).toBe(normPosix);

    const fpWindows = generateFingerprint(normWindows);
    const fpPosix = generateFingerprint(normPosix);

    expect(fpWindows).toBe(fpPosix);
  });

  it('normalizes relative path prefixes and drive letters', () => {
    const winRelative = '.\\src\\utils\\date.ts:10:2 - TS2304: Cannot find name "moment"';
    const posixRelative = './src/utils/date.ts:10:2 - TS2304: Cannot find name "moment"';

    expect(normalizeOutput(winRelative)).toBe(normalizeOutput(posixRelative));

    const winDrive = 'C:\\project\\src\\main.ts:5:1';
    const normalizedDrive = normalizeOutput(winDrive);
    expect(normalizedDrive).toContain('C:/project/src/main.ts:5:1');
    expect(normalizedDrive).not.toContain('\\');
  });

  // ─── Item 5.3: Node Version Enforcement ────────────────────────────────────

  it('rejects Node versions below 22.5.0 with actionable structured stderr payload', () => {
    const stderrMessages: string[] = [];
    const captureWrite = (msg: string) => stderrMessages.push(msg);

    // Node 20 LTS (unsupported due to lack of built-in node:sqlite DatabaseSync)
    expect(() => {
      checkNodeVersion('20.11.0', { exitOnError: false, stderrWrite: captureWrite });
    }).toThrow(/Node\.js >= 22\.5\.0/);

    expect(stderrMessages.length).toBe(1);
    const parsed = JSON.parse(stderrMessages[0]!);
    expect(parsed.error).toBe('unsupported_node_version');
    expect(parsed.required).toBe('>=22.5.0');
    expect(parsed.actual).toBe('20.11.0');
    expect(parsed.message).toContain('node:sqlite DatabaseSync');

    // Node 22.4.0 (unsupported, DatabaseSync added in 22.5.0)
    expect(() => {
      checkNodeVersion('22.4.0', { exitOnError: false, stderrWrite: captureWrite });
    }).toThrow(/Node\.js >= 22\.5\.0/);
  });

  it('accepts Node versions >= 22.5.0', () => {
    expect(checkNodeVersion('22.5.0', { exitOnError: false })).toBe(true);
    expect(checkNodeVersion('22.15.0', { exitOnError: false })).toBe(true);
    expect(checkNodeVersion('24.0.0', { exitOnError: false })).toBe(true);
  });
});
