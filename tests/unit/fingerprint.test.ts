import { describe, it, expect } from 'vitest';
import { generateFingerprint } from '../../src/core/fingerprint.js';

describe('generateFingerprint', () => {
  it('generates a sha256: prefixed lowercase hex fingerprint', () => {
    const fp = generateFingerprint('error TS2345: Argument of type string is not assignable');
    expect(fp).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it('produces identical fingerprints for identical inputs', () => {
    const fp1 = generateFingerprint('Cannot find module vitest');
    const fp2 = generateFingerprint('Cannot find module vitest');
    expect(fp1).toBe(fp2);
  });

  it('produces different fingerprints for different inputs', () => {
    const fp1 = generateFingerprint('Error A');
    const fp2 = generateFingerprint('Error B');
    expect(fp1).not.toBe(fp2);
  });
});
