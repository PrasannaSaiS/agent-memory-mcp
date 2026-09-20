/**
 * Statistics helpers for Phase 8 evaluation harness.
 *
 * Implements Wilcoxon signed-rank test and effect size (r = Z/sqrt(N)).
 * We use Wilcoxon signed-rank rather than t-tests due to the small scenario count —
 * this limitation is explicitly stated in all reports.
 */
export interface PairedObs {
    a: number;
    b: number;
}
export interface WilcoxonResult {
    W: number;
    p: number;
    r: number;
    n: number;
    interpretation: string;
    limitation: string;
}
export declare function wilcoxonSignedRank(pairs: PairedObs[]): WilcoxonResult;
export declare const LIMITATION_TEXT: string;
//# sourceMappingURL=stats.d.ts.map