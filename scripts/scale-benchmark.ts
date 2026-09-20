import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { MemoryService } from '../src/core/memoryService.js';
import { JsonlStorage } from '../src/storage/jsonl.js';
import { SqliteIndex } from '../src/storage/index.js';
import type { MemoryRecord } from '../src/types.js';
import { normalizeOutput } from '../src/core/normalize.js';
import { generateFingerprint } from '../src/core/fingerprint.js';

interface BenchmarkResult {
  scale: number;
  exactP50Ms: number;
  exactP95Ms: number;
  fuzzyP50Ms: number;
  fuzzyP95Ms: number;
  rebuildTimeMs: number;
  jsonlSizeBytes: number;
  dbSizeBytes: number;
  bytesPerRecordJsonl: number;
  bytesPerRecordDb: number;
}

const ERROR_TEMPLATES = [
  'TypeError: Cannot read properties of undefined (reading "prop_INDEX") at src/server.ts:LINE:12',
  'Error: Cannot find module "@org/pkg-INDEX" imported from src/loader.ts:LINE:5',
  'TS2322: Type "string" is not assignable to type "number" in src/models/user_INDEX.ts:LINE:20',
  'FetchError: request to https://api.internal.net/v1/resource_INDEX failed, reason: connect ECONNREFUSED',
  'AssertionError: expected { status: 200 } to deeply equal { status: 500 } at test_INDEX.spec.ts:LINE:4',
  'cargo: error[E0432]: unresolved import "crate::module_INDEX" in src/main.rs:LINE:1',
];

function generateRecord(index: number): MemoryRecord {
  const template = ERROR_TEMPLATES[index % ERROR_TEMPLATES.length]!;
  const rawOutput = template
    .replace(/INDEX/g, String(index))
    .replace(/LINE/g, String((index * 13) % 400 + 1));
  const normalized = normalizeOutput(rawOutput);
  const fingerprint = generateFingerprint(normalized);

  return {
    schemaVersion: 1,
    id: `rec_${String(index).padStart(6, '0')}`,
    createdAt: new Date(1700000000000 + index * 1000).toISOString(),
    repositoryId: 'bench-repo',
    command: 'npm test',
    exitCode: 1,
    rawOutputRedacted: rawOutput,
    normalizedOutput: normalized,
    fingerprint,
    normalizerVersion: 1,
    fix: {
      commands: [`npm install --save @org/pkg-${String(index % 50)}`],
      explanation: `Automated resolution explanation for benchmark fault scenario ${String(index)}`,
      risk: 'low',
    },
    environment: {
      os: 'win32',
      node: 'v22.5.0',
      packageManager: 'npm',
      lockfileHashes: {},
    },
    verification: {
      status: 'passed',
      verifiedAt: new Date().toISOString(),
      method: 'test_execution',
      wilsonLowerBound: 0.85,
    },
    provenance: {
      author: 'Benchmark Generator',
      commit: 'abc123def456',
    },
    supersedes: null,
    tags: ['benchmark', 'scale-test'],
    poisoningFlag: null,
  };
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.min(Math.floor(sorted.length * p), sorted.length - 1);
  return Number((sorted[idx] ?? 0).toFixed(2));
}

async function runBenchmarkForScale(scale: number): Promise<BenchmarkResult> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `bench-scale-${String(scale)}-`));
  const memoryDir = path.join(tmpDir, '.agent-memory');
  fs.mkdirSync(memoryDir, { recursive: true });

  const jsonlPath = path.join(memoryDir, 'records.jsonl');
  const dbPath = path.join(memoryDir, 'index.db');

  // 1. Generate records and batch-write to JSONL
  const records: MemoryRecord[] = new Array(scale);
  const jsonlLines: string[] = new Array(scale);
  for (let i = 0; i < scale; i++) {
    const rec = generateRecord(i);
    records[i] = rec;
    jsonlLines[i] = JSON.stringify(rec);
  }
  fs.writeFileSync(jsonlPath, jsonlLines.join('\n') + '\n', 'utf8');

  // 2. Measure Index Rebuild Time from scratch
  const sqlite = new SqliteIndex(dbPath);
  const rebuildStart = performance.now();
  sqlite.rebuildIndex(records);
  const rebuildTimeMs = Number((performance.now() - rebuildStart).toFixed(2));

  // Initialize MemoryService against the built database
  const service = new MemoryService({
    memoryDir,
    repositoryId: 'bench-repo',
  });

  // 3. Measure Exact Match Latencies (50 iterations)
  const exactLatencies: number[] = [];
  const testIterations = 50;

  for (let i = 0; i < testIterations; i++) {
    // Pick target record from different parts of the corpus
    const targetIdx = (i * 197) % scale;
    const target = records[targetIdx]!;
    const t0 = performance.now();
    const res = await service.findFix({
      command: 'npm test',
      output: target.rawOutputRedacted,
    });
    const elapsed = performance.now() - t0;
    exactLatencies.push(elapsed);
    if (res.matches.length === 0) {
      throw new Error(`Exact match failed for index ${targetIdx}`);
    }
  }
  exactLatencies.sort((a, b) => a - b);
  const exactP50Ms = percentile(exactLatencies, 0.5);
  const exactP95Ms = percentile(exactLatencies, 0.95);

  // 4. Measure Fuzzy Match Latencies (50 iterations with line-shifted queries)
  const fuzzyLatencies: number[] = [];
  for (let i = 0; i < testIterations; i++) {
    const targetIdx = (i * 197) % scale;
    const target = records[targetIdx]!;
    // Shift line numbers to force exact match failure and trigger fuzzy fallback
    const shiftedOutput = target.rawOutputRedacted.replace(/:(\d+):/, ':99999:');
    const t0 = performance.now();
    await service.findFix({
      command: 'npm test',
      output: shiftedOutput,
      threshold: 0.5,
      limit: 5,
    });
    const elapsed = performance.now() - t0;
    fuzzyLatencies.push(elapsed);
  }
  fuzzyLatencies.sort((a, b) => a - b);
  const fuzzyP50Ms = percentile(fuzzyLatencies, 0.5);
  const fuzzyP95Ms = percentile(fuzzyLatencies, 0.95);

  // Measure file sizes
  const jsonlStat = fs.statSync(jsonlPath);
  const dbStat = fs.statSync(dbPath);

  service.close();
  sqlite.close();

  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {}

  return {
    scale,
    exactP50Ms,
    exactP95Ms,
    fuzzyP50Ms,
    fuzzyP95Ms,
    rebuildTimeMs,
    jsonlSizeBytes: jsonlStat.size,
    dbSizeBytes: dbStat.size,
    bytesPerRecordJsonl: Math.round(jsonlStat.size / scale),
    bytesPerRecordDb: Math.round(dbStat.size / scale),
  };
}

async function main(): Promise<void> {
  const scales = [100, 1000, 10000];
  const results: BenchmarkResult[] = [];

  for (const scale of scales) {
    process.stderr.write(`Running benchmark scale N = ${scale}...\n`);
    const res = await runBenchmarkForScale(scale);
    results.push(res);
  }

  process.stdout.write(JSON.stringify(results, null, 2) + '\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
