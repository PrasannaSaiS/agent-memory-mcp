/**
 * Retrieval Benchmark: Measures exact and fuzzy retrieval latency at 100, 1,000, and 10,000 records.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { MemoryService } from '../dist/core/memoryService.js';

interface BenchmarkMetrics {
  scale: number;
  exactLatencyMs: number;
  fuzzyLatencyMs: number;
}

async function benchmarkScale(scale: number): Promise<BenchmarkMetrics> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `bench-${String(scale)}-`));
  const memoryDir = path.join(tmpDir, '.agent-memory');
  fs.mkdirSync(memoryDir, { recursive: true });

  const service = new MemoryService({
    memoryDir,
    repositoryId: 'bench-repo',
  });

  const sampleErrorTemplates = [
    'TypeError: Cannot read properties of undefined (reading "INDEX") at service.ts:LINE:12',
    'Error: Cannot find module "PKG_NAME" imported from loader.ts:LINE:5',
    'FetchError: request to https://api.internal.net/v1/RESOURCE failed, reason: connect ECONNREFUSED',
    'SyntaxError: Unexpected token "TOKEN" at parser.ts:LINE:1',
    'Process exited with status STATUS: compilation error in compiler.ts:LINE:8',
  ];

  // 1. Seed database with scale records
  for (let i = 0; i < scale; i++) {
    const template = sampleErrorTemplates[i % sampleErrorTemplates.length]!;
    const output = template
      .replace('INDEX', `prop_${String(i)}`)
      .replace('PKG_NAME', `@org/package-${String(i % 50)}`)
      .replace('RESOURCE', `endpoint_${String(i % 20)}`)
      .replace('TOKEN', `tok_${String(i)}`)
      .replace('STATUS', String((i % 5) + 1))
      .replace('LINE', String((i * 7) % 500));

    await service.recordFailure({
      command: 'npm test',
      exitCode: 1,
      output,
      fixCommands: [`npm run fix-${String(i % 10)}`],
      explanation: `Automated fix explanation for benchmark entry ${String(i)}`,
    });
  }

  // 2. Measure exact lookup
  const exactTargetOutput = sampleErrorTemplates[0]!
    .replace('INDEX', 'prop_42')
    .replace('LINE', String((42 * 7) % 500));

  const exactStart = performance.now();
  const iterations = 20;
  for (let j = 0; j < iterations; j++) {
    await service.findFix({
      command: 'npm test',
      output: exactTargetOutput,
    });
  }
  const exactLatencyMs = Number(((performance.now() - exactStart) / iterations).toFixed(2));

  // 3. Measure fuzzy lookup (slightly perturbed output to force fallback)
  const fuzzyTargetOutput = sampleErrorTemplates[0]!
    .replace('INDEX', 'prop_42')
    .replace('LINE', '999'); // line shift forces fuzzy search

  const fuzzyStart = performance.now();
  for (let k = 0; k < iterations; k++) {
    await service.findFix({
      command: 'npm test',
      output: fuzzyTargetOutput,
      threshold: 0.6,
    });
  }
  const fuzzyLatencyMs = Number(((performance.now() - fuzzyStart) / iterations).toFixed(2));

  service.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });

  return { scale, exactLatencyMs, fuzzyLatencyMs };
}

async function runAllBenchmarks(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('Starting retrieval benchmark across 100, 1,000, and 10,000 records...');

  const scales = [100, 1000, 10000];
  const results: BenchmarkMetrics[] = [];

  for (const scale of scales) {
    // eslint-disable-next-line no-console
    console.log(`Running benchmark at scale = ${String(scale)}...`);
    const metrics = await benchmarkScale(scale);
    results.push(metrics);
  }

  // eslint-disable-next-line no-console
  console.log('\n--- Benchmark Results ---');
  // eslint-disable-next-line no-console
  console.table(results);
}

runAllBenchmarks().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Benchmark failed:', err);
  process.exit(1);
});
