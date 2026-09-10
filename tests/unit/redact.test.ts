import { describe, it, expect } from 'vitest';
import { redactSensitiveData, calculateShannonEntropy } from '../../src/core/redact.js';

describe('redactSensitiveData', () => {
  it('redacts GitHub personal access tokens', () => {
    const raw = 'Error: authentication failed with token ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ123456';
    const clean = redactSensitiveData(raw);
    expect(clean).not.toContain('ghp_');
    expect(clean).toContain('[REDACTED_GITHUB_TOKEN]');
  });

  it('redacts OpenAI and Anthropic API keys', () => {
    const raw = 'Failed with sk-1234567890abcdefABCDEF123456 and sk-ant-api03-abcdef1234567890';
    const clean = redactSensitiveData(raw);
    expect(clean).toContain('[REDACTED_API_KEY]');
    expect(clean).not.toContain('sk-1234567890');
    expect(clean).not.toContain('sk-ant-api03');
  });

  it('redacts basic auth credentials in URLs', () => {
    const raw =
      'FetchError: failed to connect to https://admin:superSecret123@internal.repo.com/api';
    const clean = redactSensitiveData(raw);
    expect(clean).not.toContain('superSecret123');
    expect(clean).toContain('https://[REDACTED_CREDENTIALS]@internal.repo.com/api');
  });

  it('redacts high entropy tokens via Shannon entropy threshold', () => {
    // 40 random base64 characters
    const highEntropy = '4fG9kLm2PqRsTuVwXyZ0123456789aBcDeFgHiJk';
    const entropy = calculateShannonEntropy(highEntropy);
    expect(entropy).toBeGreaterThanOrEqual(4.5);

    const text = `Received invalid signature: ${highEntropy} at line 4`;
    const clean = redactSensitiveData(text);
    expect(clean).toContain('[REDACTED_HIGH_ENTROPY]');
    expect(clean).not.toContain(highEntropy);
  });
});
