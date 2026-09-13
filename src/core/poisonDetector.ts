/**
 * Persisted-Retrieval Poisoning Detector - Phase 5.
 *
 * Heuristic-based flagging that detects (but does NOT silently strip) prompt-injection
 * payloads planted inside memory records. Every detection raises a PoisoningFlag;
 * records are quarantined and surfaced via the dashboard Security and Redaction Audit screen.
 *
 * Design invariant: this is a DETECTION layer, not an execution sandbox.
 * See docs/threat-model.md section 5 for an explicit list of what this does NOT defend against.
 */

import type { PoisoningFlag } from '../types.js';

/** Second-person imperative payloads - the classic tool-poisoning attack form. */
const IMPERATIVE_INJECTION_PATTERNS: RegExp[] = [
  /\bignore\s+(?:all\s+)?(?:previous|prior|earlier|above|your)\s+instructions?\b/i,
  /\bforget\s+(?:all\s+)?(?:previous|prior|your)\s+instructions?\b/i,
  /\bdisregard\s+(?:all\s+)?(?:previous|prior|your)\s+instructions?\b/i,
  /\boverride\s+(?:your\s+)?(?:instructions?|system\s+prompt|directives?)\b/i,
  /\bnew\s+(?:task|instruction|directive|command)\s*[:]/i,
  /\byou\s+are\s+now\s+(?:a|an|the)\b/i,
  /\bpretend\s+(?:you\s+are|to\s+be)\b/i,
  /\bdo\s+not\s+(?:tell|inform|mention|reveal)\s+(?:the\s+)?user\b/i,
  /\bdo\s+not\s+(?:follow|obey|apply)\s+(?:your\s+)?(?:safety|policy|restriction|guideline)/i,
  /\bact\s+as\s+(?:if\s+you\s+(?:are|were)|a\s+)/i,
];

/** Fake system-prompt injection markers - simulate context-delimiters to confuse LLM parsers. */
const SYSTEM_PROMPT_MARKERS: RegExp[] = [
  /\bsystem\s*(?:message|prompt|instruction|context|note)\b/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /<\|system\|>/i,
  /<<SYS>>/i,
  /\bbegininstruction\b/i,
  /\bendinstruction\b/i,
];

/** Data-exfiltration attempt signatures. */
const EXFILTRATION_PATTERNS: RegExp[] = [
  /\bexfiltrate\b/i,
  /\bsend\s+(?:your\s+)?(?:system\s+)?prompt\s+to\b/i,
  /\bpost\s+(?:the\s+)?(?:conversation(?:\s+context)?|prompt|context)\s+to\s+https?:\/\//i,
  /curl\s+-X\s+POST\b/i,
  /\bwebhook\b.*\bsend\b/i,
  /\bdata\s+exfil(?:tration)?\b/i,
];

/** Nested or recursive injection - injection inside quoted or encoded contexts. */
const NESTED_INJECTION_PATTERNS: RegExp[] = [
  /"\s*ignore\s+(?:previous|prior)\s+instructions/i,
  /\bbase64\b.*\bdecode\b/i,
];

/** Zero-width and invisible Unicode characters used to hide payloads from human reviewers. */
const ZERO_WIDTH_REGEX = /[\u200B-\u200F\u2028\u2029\u202A-\u202E\u2060-\u2064\uFEFF\u00AD]/;

/** Unicode homoglyph characters visually confusable with ASCII letters. */
const HOMOGLYPH_REGEX = /[\u0430\u0435\u043E\u0440\u0441\u0443\u0445\u0456\u0458\u04CF\u03BF\u03C1\u03B1\u03B5\u03B9\u03BD\u03C5\u03C7\uFF01-\uFF5E]/;

const IMPERATIVE_VERBS = [
  'run', 'execute', 'call', 'invoke', 'send', 'post', 'delete',
  'remove', 'install', 'download', 'fetch', 'access', 'open',
  'read', 'write', 'modify', 'override', 'bypass', 'disable',
  'ignore', 'skip', 'forget', 'pretend', 'assume', 'believe',
];

const IMPERATIVE_VERB_PATTERN = new RegExp(
  `\\b(${IMPERATIVE_VERBS.join('|')})\\b`,
  'gi',
);

const IMPERATIVE_DENSITY_THRESHOLD = 8;

function computeImperativeDensity(text: string): number {
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount === 0) return 0;
  const matches = text.match(IMPERATIVE_VERB_PATTERN);
  const matchCount = matches?.length ?? 0;
  return (matchCount / wordCount) * 100;
}

export interface PoisoningDetectionResult {
  flag: PoisoningFlag | null;
  detectorId?: string;
  imperativeDensity?: number;
}

/**
 * Runs the full poisoning detection pipeline against a text string.
 * Returns null flag if no signal is found; a PoisoningFlag otherwise.
 * Design: Flag, do not strip. Records are quarantined by the caller.
 */
export function detectPoisoning(text: string): PoisoningDetectionResult {
  for (const pattern of IMPERATIVE_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        flag: {
          raisedAt: new Date().toISOString(),
          reason: `Imperative injection pattern detected: ${pattern.source.slice(0, 80)}`,
          status: 'reviewed',
        },
        detectorId: 'imperative_injection',
      };
    }
  }

  for (const pattern of SYSTEM_PROMPT_MARKERS) {
    if (pattern.test(text)) {
      return {
        flag: {
          raisedAt: new Date().toISOString(),
          reason: `Fake system-prompt marker detected: ${pattern.source.slice(0, 80)}`,
          status: 'reviewed',
        },
        detectorId: 'system_prompt_marker',
      };
    }
  }

  for (const pattern of EXFILTRATION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        flag: {
          raisedAt: new Date().toISOString(),
          reason: `Data-exfiltration pattern detected: ${pattern.source.slice(0, 80)}`,
          status: 'reviewed',
        },
        detectorId: 'exfiltration',
      };
    }
  }

  for (const pattern of NESTED_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        flag: {
          raisedAt: new Date().toISOString(),
          reason: `Nested/encoded injection attempt detected: ${pattern.source.slice(0, 80)}`,
          status: 'reviewed',
        },
        detectorId: 'nested_injection',
      };
    }
  }

  if (ZERO_WIDTH_REGEX.test(text)) {
    return {
      flag: {
        raisedAt: new Date().toISOString(),
        reason: 'Zero-width or invisible Unicode character detected - possible payload obfuscation',
        status: 'reviewed',
      },
      detectorId: 'zero_width',
    };
  }

  if (HOMOGLYPH_REGEX.test(text)) {
    return {
      flag: {
        raisedAt: new Date().toISOString(),
        reason: 'Unicode homoglyph characters detected (Cyrillic/Greek/Fullwidth confusables)',
        status: 'reviewed',
      },
      detectorId: 'homoglyph',
    };
  }

  const density = computeImperativeDensity(text);
  if (text.split(/\s+/).length >= 20 && density > IMPERATIVE_DENSITY_THRESHOLD) {
    return {
      flag: {
        raisedAt: new Date().toISOString(),
        reason: `High imperative-verb density: ${density.toFixed(1)} per 100 words (threshold: ${IMPERATIVE_DENSITY_THRESHOLD})`,
        status: 'reviewed',
      },
      detectorId: 'imperative_density',
      imperativeDensity: density,
    };
  }

  return { flag: null, imperativeDensity: density };
}

/**
 * Runs detectPoisoning against multiple fields; returns the first flag found or null.
 */
export function detectPoisoningInRecord(fields: string[]): PoisoningDetectionResult {
  for (const field of fields) {
    const result = detectPoisoning(field);
    if (result.flag) return result;
  }
  return { flag: null };
}
