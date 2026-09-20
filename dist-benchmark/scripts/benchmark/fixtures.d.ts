/**
 * Scripted deterministic failure scenarios for Phase 8.
 * Each fixture has a known failure, known fix, and a correct resolution label.
 * Deterministic — no LLM calls. The "agent" is simulated by the memory retrieval system.
 *
 * Six scenario types per Phase 8 spec:
 *   1. dependency-mismatch
 *   2. typescript-compile-error
 *   3. missing-env-var
 *   4. port-collision
 *   5. test-assertion
 *   6. platform-path
 */
export interface Scenario {
    id: string;
    type: 'dependency-mismatch' | 'typescript-compile-error' | 'missing-env-var' | 'port-collision' | 'test-assertion' | 'platform-path';
    command: string;
    exitCode: number;
    output: string;
    knownFixCommands: string[];
    knownFixExplanation: string;
    /** Used for false-reuse detection: a different scenario that should NOT match this one */
    distractorOutput?: string;
}
export declare const SCENARIOS: Scenario[];
/** Distractor scenarios: same command family but different error — should NOT match */
export declare const DISTRACTORS: Pick<Scenario, 'id' | 'command' | 'output'>[];
//# sourceMappingURL=fixtures.d.ts.map