import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { CommandPolicyEngine } from '../../src/policy/commandPolicy.js';

describe('Command Policy Hardening: Approvals & Workspace Containment', () => {
  let tmpDir: string;
  let workspaceDir: string;
  let memoryDir: string;
  let engine: CommandPolicyEngine;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-policy-'));
    workspaceDir = path.join(tmpDir, 'workspace');
    memoryDir = path.join(workspaceDir, '.agent-memory');
    fs.mkdirSync(memoryDir, { recursive: true });
    engine = new CommandPolicyEngine(workspaceDir, memoryDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // ─── 1. Approval Resolution Hardening ───────────────────────────────────────

  it('prevents approvalId hijacking when command does not match', () => {
    const resolvedPath = path.join(memoryDir, 'approvals-resolved.jsonl');
    const validApproval = {
      approvalId: 'app-legit-456',
      createdAt: new Date().toISOString(),
      command: 'npm test',
      decision: 'approve',
      resolvedBy: 'operator-alice',
    };
    fs.writeFileSync(resolvedPath, JSON.stringify(validApproval) + '\n', 'utf8');

    // Legit command matches
    expect(engine.hasResolvedApproval('npm test', 'app-legit-456')).toBe(true);

    // Hijacked command using legit approvalId must be rejected
    expect(engine.hasResolvedApproval('npm install evil-package', 'app-legit-456')).toBe(false);
  });

  it('recovers gracefully from corrupted JSON lines in approvals-resolved.jsonl', () => {
    const resolvedPath = path.join(memoryDir, 'approvals-resolved.jsonl');
    const validApproval = {
      approvalId: 'app-good-789',
      createdAt: new Date().toISOString(),
      command: 'npm run build',
      decision: 'approve',
    };

    // File contains corrupted lines before and after valid approval
    const content = [
      '{"truncated_json": true',
      'NOT JSON AT ALL',
      JSON.stringify(validApproval),
      '{"incomplete":',
    ].join('\n');

    fs.writeFileSync(resolvedPath, content, 'utf8');

    expect(engine.hasResolvedApproval('npm run build', 'app-good-789')).toBe(true);
    expect(engine.hasResolvedApproval('npm test')).toBe(false);
  });

  // ─── 2. Workspace Containment & Path Traversal ───────────────────────────────

  it('blocks absolute path traversal outside workspace root', () => {
    const isWindows = process.platform === 'win32';
    const outsideTarget = isWindows ? 'C:\\Windows\\System32\\cmd.exe' : '/etc/shadow';

    const result = engine.validateCommand(`python ${outsideTarget}`);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Workspace escape attempt detected');
  });

  it('blocks relative parent traversal in positional arguments', () => {
    const result = engine.validateCommand('cargo build ../../secret/Cargo.toml');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Workspace escape attempt detected');
  });

  it('blocks path escape inside flag values', () => {
    const result = engine.validateCommand('cargo build --manifest-path=../../evil/Cargo.toml');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Workspace escape attempt detected');
  });

  it('allows safe relative paths inside workspace root', () => {
    const result = engine.validateCommand('npm test tests/unit/foo.test.ts');
    expect(result.allowed).toBe(true);
    expect(result.parsed?.binary).toBe('npm');
  });
});
