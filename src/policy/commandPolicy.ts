/**
 * commandPolicy — allowlist and safety policy for verify_fix.
 * Implementation in Phase 4.
 *
 * SECURITY: Never execute shell strings. Use argument arrays only.
 * Never execute without explicit approval + resolved approvals-resolved.jsonl entry.
 * Enforce workspace containment, timeout, output cap, and cancellation.
 * Destructive commands (rm, sudo, etc.) are permanently disallowed in MVP.
 */
export {};
