/**
 * Versioned output normalizer.
 * ADR-004 compliant.
 */

export const CURRENT_NORMALIZER_VERSION = 1;

const ISO_TIMESTAMP_REGEX = /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\b/g;
const TIME_STAMP_REGEX = /\b\d{2}:\d{2}:\d{2}(?:\.\d+)?\b/g;
const UUID_REGEX =
  /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g;
const HEX_ADDR_REGEX = /\b0x[0-9a-fA-F]+\b/g;
const DURATION_REGEX = /\b\d+(?:\.\d+)?(?:ms|s|m|min)\b/g;
const TMP_DIR_WIN_REGEX = /[a-zA-Z]:\\(?:[^\\"\s']+\\)*AppData\\Local\\Temp[^\s"']*/gi;
const TMP_DIR_UNIX_REGEX = /\/tmp\/[^\s"']+/g;

/**
 * Strips volatile runtime noise and normalizes text for deterministic fingerprinting.
 */
export function normalizeOutput(text: string): string {
  if (!text) return '';

  // 1. Unicode NFKC normalization
  let normalized = text.normalize('NFKC');

  // 2. Volatile timestamps
  normalized = normalized.replace(ISO_TIMESTAMP_REGEX, '<TIMESTAMP>');
  normalized = normalized.replace(TIME_STAMP_REGEX, '<TIMESTAMP>');

  // 3. Volatile UUIDs
  normalized = normalized.replace(UUID_REGEX, '<UUID>');

  // 4. Memory pointers
  normalized = normalized.replace(HEX_ADDR_REGEX, '<HEX_ADDR>');

  // 5. Durations / timing variations
  normalized = normalized.replace(DURATION_REGEX, '<DURATION>');

  // 6. Temporary directories
  normalized = normalized.replace(TMP_DIR_WIN_REGEX, '<TMP_DIR>');
  normalized = normalized.replace(TMP_DIR_UNIX_REGEX, '<TMP_DIR>');

  // 7. Path separator normalization: normalize Windows backslashes in paths to POSIX forward slashes
  normalized = normalized.replace(/([a-zA-Z]):\\/g, '$1:/');
  normalized = normalized.replace(/(\.{1,2})\\/g, '$1/');
  while (/([a-zA-Z0-9_.~-]+)\\([a-zA-Z0-9_.~-]+)/.test(normalized)) {
    normalized = normalized.replace(/([a-zA-Z0-9_.~-]+)\\([a-zA-Z0-9_.~-]+)/g, '$1/$2');
  }

  // 8. Whitespace trimming & consistent newlines
  normalized = normalized.replace(/\r\n/g, '\n').trim();

  return normalized;
}
