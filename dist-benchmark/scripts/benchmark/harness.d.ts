/**
 * Phase 8 Evaluation Harness
 *
 * Deterministic benchmark — no LLM calls. The "agent" is the memory retrieval system.
 * Simulates four baselines:
 *   B0 — no memory: always fails to retrieve (repair = false, TTR = fixed penalty)
 *   B1 — exact only: only exact fingerprint match counts
 *   B2 — exact + fuzzy: includes fuzzy retrieval
 *   B3 — full system: B2 + staleness filtering + verification-weighted ranking
 *   B3+DEF — B3 with poisoning defense overhead measured
 *
 * Metrics per scenario:
 *   repairSuccess, elapsedMs, toolCalls, falseReuse, unsafeSuggestion, lookupMs, storageBytes
 *
 * Token counts: NOT AVAILABLE (no LLM in harness). Field set to null per spec
 * ("Never fabricate missing telemetry").
 *
 * Statistics: Wilcoxon signed-rank + effect size r, with explicit limitation warning.
 */
export {};
//# sourceMappingURL=harness.d.ts.map