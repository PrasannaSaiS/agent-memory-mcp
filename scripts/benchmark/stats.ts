/**
 * Statistics helpers for Phase 8 evaluation harness.
 *
 * Implements Wilcoxon signed-rank test and effect size (r = Z/sqrt(N)).
 * We use Wilcoxon signed-rank rather than t-tests due to the small scenario count —
 * this limitation is explicitly stated in all reports.
 */

export interface PairedObs { a: number; b: number; }

export interface WilcoxonResult {
  W: number;
  p: number;
  r: number;
  n: number;
  interpretation: string;
  limitation: string;
}

function normalCdf(z: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const absZ = Math.abs(z);
  const t = 1.0 / (1.0 + p * absZ);
  const poly = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
  const cdf = 1.0 - poly * Math.exp(-absZ * absZ / 2);
  return z >= 0 ? cdf : 1 - cdf;
}

export function wilcoxonSignedRank(pairs: PairedObs[]): WilcoxonResult {
  const diffs = pairs.map(({ a, b }) => a - b).filter((d) => d !== 0);
  const n = diffs.length;
  if (n === 0) return { W: 0, p: 1, r: 0, n: 0, interpretation: 'no variation', limitation: LIMITATION_TEXT };

  const indexed = diffs.map((d) => ({ d, abs: Math.abs(d), sign: d > 0 ? 1 : -1 }));
  indexed.sort((a, b) => a.abs - b.abs);
  const ranks = new Array<number>(indexed.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j < indexed.length - 1 && indexed[j]!.abs === indexed[j + 1]!.abs) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[k] = avg;
    i = j + 1;
  }
  let Wplus = 0;
  for (let k = 0; k < indexed.length; k++) {
    if (indexed[k]!.sign > 0) Wplus += ranks[k]!;
  }
  const mu = n * (n + 1) / 4;
  const sigma = Math.sqrt(n * (n + 1) * (2 * n + 1) / 24);
  const Z = (Wplus - mu) / sigma;
  const pValue = 2 * (1 - normalCdf(Math.abs(Z)));
  const r = Math.abs(Z) / Math.sqrt(n);
  const interp = r >= 0.5 ? 'large effect' : r >= 0.3 ? 'medium effect' : 'small effect';
  return { W: Wplus, p: Math.round(pValue * 1e6) / 1e6, r: Math.round(r * 1000) / 1000, n, interpretation: interp, limitation: LIMITATION_TEXT };
}

export const LIMITATION_TEXT =
  'WARNING: Small scenario count (n<20). Normal approximation for Wilcoxon may be imprecise. ' +
  'Results are indicative only. Do not over-interpret effect sizes or p-values. ' +
  'Report Wilcoxon signed-rank W+, two-tailed p, and r=Z/sqrt(N) per Hollander & Wolfe (1999).';
