# Agent Memory MCP: validation, research framing, and delivery plan

**Prepared:** 16 August 2026  
**Audience:** final-year software-engineering student, supervisor, and technical interviewers

## Executive verdict

This is a **strong, implementable capstone** if it is framed as a reproducible software-engineering experiment rather than “an MCP server that stores fixes.” The product is useful: repository-local, reviewable memory can reduce repeated diagnosis and provide team knowledge without a hosted vector database. The core engineering is achievable in one semester by one student.

The weak version is a thin CRUD wrapper around JSON and a hash. The strong version makes three defensible contributions:

1. **Safety-oriented error normalization and retrieval:** a measured pipeline that removes volatile tokens while preserving diagnostic signal, with exact-match-first and calibrated fuzzy fallback.
2. **Environment-aware trust:** dependency/toolchain fingerprints, confidence, provenance, and explicit re-verification rather than blindly returning a historical command.
3. **A reproducible evaluation:** a benchmark of repeated failures and near-misses comparing baseline agent behavior with memory-assisted behavior.

Do not claim that it “prevents agents consuming tokens” universally. Measure tokens, time, tool calls, successful recovery, false reuse, and unsafe suggestions; state the conditions under which it helps.

## Research and ecosystem validation

MCP is an open protocol using JSON-RPC 2.0 between a host, client, and server. The official specification describes server **tools, resources, and prompts**, and stresses consent, privacy, and tool-safety controls. The official build guide recommends stderr logging for stdio servers: stdout is reserved for protocol messages. The TypeScript SDK is the official ecosystem choice, but pin a tested SDK release instead of relying on “latest.”

Relevant primary sources:

- MCP specification: https://modelcontextprotocol.io/specification/latest
- MCP architecture: https://modelcontextprotocol.io/docs/learn/architecture
- Official build-server guide: https://modelcontextprotocol.io/docs/develop/build-server
- Official TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- SQLite documentation: https://www.sqlite.org/docs.html
- Node.js crypto SHA-256 API: https://nodejs.org/api/crypto.html
- Levenshtein background (standard edit-distance reference): https://en.wikipedia.org/wiki/Levenshtein_distance

### Novelty assessment

MCP itself is not novel; error logs, build-failure mining, case-based reasoning, fuzzy matching, and developer knowledge bases are established areas. A repository-scoped, git-synchronised error-fix memory **may be a novel integration and evaluation target**, but novelty must be established by a systematic literature and product review before making a research claim. Search IEEE Xplore, ACM DL, arXiv, Google Scholar, GitHub, and MCP registries using combinations of: `build failure fix reuse`, `developer error knowledge base`, `case based reasoning software debugging`, `LLM agent memory coding`, `MCP error memory`, `repository scoped agent memory`, `failure fingerprinting`.

A defensible paper claim is: “We design and evaluate a provenance- and environment-aware retrieval component for coding agents.” It is not: “We invented error caching.” Include a comparison table of at least 10 related systems/papers and clearly identify the delta.

## Scope recommendation

### MVP (must ship)

- TypeScript/Node.js MCP server over stdio.
- Workspace root supplied by MCP roots/config; never assume current working directory.
- `record_failure`, `find_fix`, `verify_fix`, `list_memory_stats` tools.
- `.agent-memory/records.jsonl` as the source of truth; `.agent-memory/schema-version` and README.
- Gitignored SQLite index rebuilt from JSONL on startup; atomic writes and file locking where needed.
- Deterministic normalization, SHA-256 fingerprint, exact lookup, bounded fuzzy fallback.
- Lockfile/toolchain fingerprint and stale status.
- Dry-run by default; verification requires explicit user approval and strict command policy.
- Unit, integration, protocol, security, and end-to-end tests; MCP Inspector test run.

### Defer (v2)

Embeddings/vector search, automatic arbitrary command execution, cloud sync, cross-repository global memory, model-generated normalization, IDE plugins, and multi-process distributed indexing. These enlarge risk and make the study harder to interpret.

## Proposed architecture

```text
MCP host/agent
   | JSON-RPC over stdio (stdout = protocol only)
   v
MCP adapter (tools/resources/prompts, schemas, auth/consent)
   v
Application service
   +-- Normalizer -> canonical text -> SHA-256
   +-- Retriever -> exact -> filtered fuzzy -> ranked evidence
   +-- Verifier -> policy gate -> sandbox/approval -> result
   +-- Provenance/staleness service
   v
Repository adapter: JSONL append-only records + SQLite gitignored index
```

### Tool contracts

`record_failure({command, exitCode, stderr, stdout?, cwd?, fix:{commands, explanation}, verification?, tags?})` returns `{recordId, fingerprint}`. Do not store secrets; redact first.

`find_fix({command?, stderr, stdout?, limit?, allowStale?:false})` returns ranked records with `matchType`, score, stale reasons, provenance, and a warning that results are advice—not authorization.

`verify_fix({recordId, mode:"dry-run"|"approved"})` should default to dry-run and return a proposed execution plan. Approved execution must use an allowlist, timeout, output cap, cancellation, and clear user confirmation. A safer MVP can make verification an external script/CI step and only record its result.

`list_memory_stats({})` returns record count, index status, age distribution, and success rate; never expose raw secrets.

A useful resource is `memory://records/{id}` for human-readable provenance. A prompt can provide a standard “diagnose -> query -> inspect warning -> propose -> verify -> record” workflow, but keep business logic in tools.

### Record schema (illustrative)

```json
{
  "schemaVersion": 1,
  "id": "uuid",
  "createdAt": "ISO-8601",
  "repositoryId": "git remote or stable local id",
  "command": "npm test",
  "exitCode": 1,
  "rawOutputRedacted": "...",
  "normalizedOutput": "...",
  "fingerprint": "sha256:...",
  "fix": {"commands": ["..."], "explanation": "...", "risk": "low|medium|high"},
  "environment": {"os": "...", "node": "...", "packageManager": "...", "lockfileHashes": {}},
  "verification": {"status": "passed|failed|unknown", "verifiedAt": null, "method": "..."},
  "provenance": {"author": "...", "commit": "..."},
  "supersedes": null
}
```

## Normalization and matching design

Use ordered, tested transformations rather than a single aggressive regex:

1. Unicode-normalize, normalize line endings, trim whitespace, cap size.
2. Redact secrets (API keys, bearer tokens, private-key blocks, connection strings) **before persistence**.
3. Replace timestamps, UUIDs, hex addresses, absolute paths, line/column numbers, PIDs, temporary directories, and environment-specific home paths with typed placeholders.
4. Preserve package names, error codes, exception classes, and nearby context. Keep both a normalized display text and a fingerprint input.
5. Hash a versioned canonical form: `normalizerVersion + NUL + commandClass + NUL + normalizedError` using SHA-256.

Maintain regression fixtures for every regex. Measure over-normalization (different errors collapsing together) and under-normalization (same failure producing multiple hashes). Fuzzy matching must be conservative: token/character similarity only after repository, command family, exit code, and optionally error class filters. Return the evidence and threshold, not only a match. Consider BM25/SQLite FTS5 as a v2 alternative to plain Levenshtein; do not call a fuzzy match a solution without verification.

## Staleness and verification

Hash relevant lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, etc.) and record package-manager/runtime versions. A record is stale if the lockfile differs, the normalizer schema changes, the record is old beyond a configurable TTL, or the verification failed. Stale records remain searchable but are visibly downgraded and excluded by default.

Never execute a stored command merely because an LLM requested it. Require explicit approval, command allowlisting, cwd containment within the workspace, no shell interpolation, timeouts, output limits, cancellation, and redaction. Treat repository content and tool descriptions as untrusted. Do not run destructive commands (`rm`, `sudo`, credential/network exfiltration, arbitrary shell pipelines) in the MVP.

## Evaluation plan (the paper’s centre)

Create 3–5 small open-source-style fixture repositories and a scripted failure corpus (dependency mismatch, TypeScript compile error, missing env var, port collision, test assertion, platform path issue). Each scenario has repeated runs and controlled mutations.

Compare:

- **B0:** agent/diagnostic script with no memory.
- **B1:** exact fingerprint only.
- **B2:** exact + fuzzy retrieval.
- **B3:** exact + fuzzy + staleness + verification (proposed).

Primary metrics: time to successful repair, agent tool calls, input/output token count (or a transparent proxy if model telemetry is unavailable), success rate, first-attempt success, false-reuse rate, unsafe-command rate, retrieval latency p50/p95, index rebuild time, and storage overhead. Report confidence intervals or bootstrap intervals; use paired scenarios and fixed prompts/model/tool limits. Ablate normalization, fuzzy retrieval, and staleness independently.

Acceptance targets (propose, then revise after pilot): p95 lookup <100 ms for 10k records; deterministic fingerprints 100% on fixtures; no stdout protocol corruption; secret-redaction recall 100% on a deliberately planted test set; ≥20% reduction in repeated-failure time/tool calls without materially increasing false reuse. Do not fabricate results—publish raw fixtures, scripts, configuration, and limitations.

## Delivery phases and artifacts

### Phase 0 — discovery and requirements (week 1)

Artifacts: problem statement, stakeholder interviews/survey, threat model, literature/product matrix, glossary, requirements and out-of-scope list.

AI coding-agent prompt:
> You are the product/research analyst. Read this repository and official MCP documentation. Produce a requirements document for a repository-scoped error-fix memory MCP server. Separate functional/non-functional requirements, assumptions, risks, ethical/privacy constraints, measurable acceptance criteria, and out-of-scope items. Do not write code. Flag every claim requiring a citation.

### Phase 1 — design (week 2)

Artifacts: C4 context/container diagrams, ADRs, JSON Schema, tool contracts, normalization specification, threat model, test strategy.

Prompt:
> Act as a security-focused architect. Design a TypeScript stdio MCP server with JSONL source-of-truth and gitignored SQLite index. Provide interfaces, failure modes, atomicity strategy, schema versioning, consent boundaries, command-execution policy, and ADRs. Prefer the smallest MVP and identify unsafe assumptions. Do not implement yet.

### Phase 2 — vertical slice (weeks 3–4)

Artifacts: runnable server, one record and exact lookup flow, README, pinned dependencies.

Prompt:
> Implement one vertical slice from the approved design: initialize MCP over stdio, expose record_failure and find_fix with strict Zod/JSON schemas, append one redacted JSONL record, index it, and retrieve an exact fingerprint. Write tests first where practical. All logs go to stderr; stdout contains only MCP messages. Run format, lint, typecheck, unit tests, and MCP Inspector; report commands and failures.

### Phase 3 — retrieval and data quality (weeks 5–6)

Artifacts: versioned normalizer, fixture corpus, fuzzy ranking, benchmarks, redaction tests.

Prompt:
> Implement the versioned normalization pipeline from the design. Add table-driven fixtures for paths, timestamps, addresses, PIDs, line numbers, Unicode, secrets, and adversarial collisions. Implement exact-first retrieval and bounded fuzzy fallback with explainable scores. Add property tests for determinism and benchmark 10k records. Reject or redact sensitive data before persistence.

### Phase 4 — staleness and safe verification (weeks 7–8)

Artifacts: lockfile hashing, stale policy, dry-run verifier, approval/allowlist policy, audit log, threat-model update.

Prompt:
> Implement staleness detection and a dry-run-first verifier. Never execute arbitrary stored shell text. Enforce workspace containment, timeout, output cap, cancellation, explicit approval, allowlisted commands, and secret redaction. Add tests for changed lockfiles, malicious commands, path traversal, timeouts, stale downgrade, and failed verification.

### Phase 5 — integration and evaluation (weeks 9–11)

Artifacts: adapters/config examples for at least two MCP hosts where available, scenario harness, baseline comparisons, metric collector, reproducibility README.

Prompt:
> Build a deterministic evaluation harness for B0–B3. Use fixed repositories, seeded mutations, fixed model settings or scripted agent traces, and record time/tool calls/tokens/success/false reuse/latency. Run ablations. Export raw CSV/JSON and generate tables. Never alter results manually; document missing telemetry and threats to validity.

### Phase 6 — hardening and dissertation/demo (weeks 12–14)

Artifacts: CI, coverage report, security review, user guide, architecture/design report, research paper, demo script, release tag.

Prompt:
> Act as a release engineer and skeptical reviewer. Audit against every requirement and threat. Run clean-clone setup, typecheck, lint, unit/integration/protocol/security tests, benchmark, and dependency audit. Identify flaky or untested behavior. Produce a release checklist, limitations, known issues, and a five-minute demo script with rollback steps.

## Engineering best practices

- Use strict TypeScript, ESM or CommonJS consistently, ESLint/Prettier, Vitest, and CI on Linux/macOS/Windows if possible.
- Pin Node and dependency versions with a lockfile; use Dependabot/Renovate and `npm audit`/OSV scanning.
- Keep pure normalization/matching functions separate from filesystem, SQLite, MCP, and process-execution adapters.
- Use migrations/schema versioning, atomic temp-file-then-rename writes, append-only records, rebuildable indexes, and deterministic ordering.
- Add correlation IDs, structured stderr logs, bounded inputs, graceful SIGTERM handling, and protocol conformance tests.
- Document data retention, deletion, `.gitignore` guidance, contributor review, and what must never be committed.
- License the code and fixtures; obtain consent before collecting team logs.

## Recommended stack and justified modifications

**Core:** Node.js LTS, TypeScript, official `@modelcontextprotocol/sdk`, Zod, Vitest, ESLint, Prettier, GitHub Actions.  
**Storage:** JSONL source of truth plus SQLite. `better-sqlite3` is convenient but native builds can reduce portability; abstract the repository and consider `node:sqlite` where the selected Node LTS supports the required APIs, or use SQLite WASM for a zero-native-install variant. Benchmark before choosing.  
**Matching:** regex + SHA-256 + token similarity/Levenshtein for MVP; SQLite FTS5/BM25 is a strong v2. Avoid embeddings initially because they complicate offline reproducibility, privacy, and explainability.  
**Testing:** MCP Inspector, protocol fixtures, property-based tests (fast-check optional), fixture repositories, and mutation tests for normalization.  
**Packaging:** `npx`/npm package and a Docker option only after local stdio works.

## Corporate interview value

A reviewer will value the project when they can see: protocol literacy, clean boundaries, tests, observability, secure execution, portability, useful documentation, CI, and measured impact. They will be concerned by arbitrary shell execution, secrets committed to git, unbounded logs, unverified fuzzy fixes, and unsupported claims of novelty. Demonstrate a failure, exact retrieval, stale warning after a lockfile change, safe dry-run, human approval, successful verification, and a git diff. Explain one design trade-off (JSONL portability versus SQLite speed) and one failure you discovered.

## Final report outline

1. Abstract and contributions (calibrated claims). 2. Problem and motivation. 3. Background: MCP, agent tool use, failure reuse. 4. Related work and gap matrix. 5. Requirements and threat model. 6. Architecture and design decisions. 7. Normalization/retrieval/staleness algorithms. 8. Implementation. 9. Experimental method and baselines. 10. Results with uncertainty and ablations. 11. Security/privacy/ethics. 12. Threats to validity. 13. Limitations and future work. 14. Conclusion. Appendices: schema, prompts, fixtures, reproducibility instructions.

## Go/no-go checklist

Proceed if you can obtain representative failure fixtures, run a local MCP host/Inspector, and define a safe verification policy. Narrow to record/retrieve/recommend (not auto-fix) if you cannot safely sandbox commands. For a research-grade result, the evaluation harness and public reproducibility package matter more than adding another matching algorithm.
