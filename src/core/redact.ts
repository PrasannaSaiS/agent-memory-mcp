/**
 * Redaction engine: Layered pattern matching + Shannon entropy detection.
 * ADR-005 compliant.
 */

const GITHUB_PAT_REGEX = /gh[pousr]_[A-Za-z0-9_]{10,255}/g;
const OPENAI_KEY_REGEX = /sk-[A-Za-z0-9_-]{20,}/g;
const ANTHROPIC_KEY_REGEX = /sk-ant-api03-[A-Za-z0-9_-]{20,}/g;
const AWS_KEY_REGEX = /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g;
const URI_CREDENTIALS_REGEX = /([a-zA-Z]+:\/\/)[^\s:@]+:[^\s:@]+(@[^\s]+)/g;
const JWT_REGEX = /ey[A-Za-z0-9-_=]+\.ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*/g;
const PEM_KEY_REGEX = /-----BEGIN [A-Z ]+PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+PRIVATE KEY-----/g;

/**
 * Calculates Shannon entropy: H(X) = -sum(P(x) * log2(P(x)))
 */
export function calculateShannonEntropy(str: string): number {
  if (!str || str.length === 0) return 0;
  const frequencies = new Map<string, number>();
  for (const char of str) {
    frequencies.set(char, (frequencies.get(char) ?? 0) + 1);
  }
  let entropy = 0;
  const len = str.length;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Synchronously redacts known credential patterns and high-entropy tokens.
 */
export function redactSensitiveData(text: string): string {
  if (!text) return '';

  let sanitized = text;

  // Tier 1: Known patterns
  sanitized = sanitized.replace(PEM_KEY_REGEX, '[REDACTED_PRIVATE_KEY]');
  sanitized = sanitized.replace(GITHUB_PAT_REGEX, '[REDACTED_GITHUB_TOKEN]');
  sanitized = sanitized.replace(OPENAI_KEY_REGEX, '[REDACTED_API_KEY]');
  sanitized = sanitized.replace(ANTHROPIC_KEY_REGEX, '[REDACTED_API_KEY]');
  sanitized = sanitized.replace(AWS_KEY_REGEX, '[REDACTED_AWS_KEY]');
  sanitized = sanitized.replace(URI_CREDENTIALS_REGEX, '$1[REDACTED_CREDENTIALS]$2');
  sanitized = sanitized.replace(JWT_REGEX, '[REDACTED_JWT]');

  // Tier 2: Shannon entropy analysis on candidate tokens (20 to 128 characters)
  const tokenRegex = /[A-Za-z0-9+/=_-]{20,128}/g;
  sanitized = sanitized.replace(tokenRegex, (token) => {
    // Skip tokens that are already redacted markers or repeated chars
    if (token.startsWith('[REDACTED_')) return token;
    const entropy = calculateShannonEntropy(token);
    // Base64/alphanumeric threshold: 4.5 bits/char for strings >= 24 chars
    if (token.length >= 24 && entropy >= 4.5) {
      return '[REDACTED_HIGH_ENTROPY]';
    }
    return token;
  });

  return sanitized;
}
