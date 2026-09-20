# agent-memory-mcp

> Repository-scoped, git-synchronized error-fix memory MCP server.

Targets **MCP specification 2026-07-28**. See `docs/adr/ADR-007-mcp-spec-version.md` for the dated ADR.

## Quick start

```bash
# Install server dependencies
npm install

# Typecheck
npm run typecheck

# Lint
npm run lint

# Run tests
npm test

# Install dashboard bridge dependencies
cd dashboard/bridge && npm install && cd ../..

# Install dashboard frontend dependencies
cd dashboard/frontend && npm install && cd ../..
```

## Repository layout

```
agent-memory-mcp/
  src/
    server.ts                      # MCP server entry point (stdio, JSON-RPC only on stdout)
    tools/                         # MCP tool handlers
    core/                          # Pure functions: normalize, fingerprint, redact, match, staleness
    storage/                       # JSONL source-of-truth + SQLite index adapters
    policy/                        # Command allowlist and execution policy
    types.ts                       # Shared TypeScript types (schema v1)
  tests/
    unit/                          # Pure-function unit tests
    integration/                   # Storage + server integration tests
    security/                      # Redaction recall, injection, traversal tests
    fixtures/                      # Normalizer regression data, poisoning corpus
    e2e/                           # MCP protocol conformance tests
  .agent-memory/
    records.jsonl                  # Source of truth (git-tracked, redacted)
    schema-version                 # Current schema integer
    README.md                      # Data-handling notes
  docs/                            # All design and evaluation documents
  dashboard/
    bridge/                        # Separate Node process — read-only bridge
    frontend/                      # React + Vite Memory Console UI
  scripts/                         # Fixture generation, benchmark harness, validation
```

## Key constraints (see AGENTS.md)

- `stdout` carries JSON-RPC **only**. All logs go to `stderr` and `.agent-memory/logs.jsonl`.
- No command executes without explicit human approval.
- Retrieved records are **untrusted data** — wrapped in explicit delimiters before returning.
- Secrets are redacted (pattern + entropy) before persistence.
- The dashboard is a **separate process** and never shares stdin/stdout with the MCP server.

## Documentation & Release Notes

- [Release Checklist](file:///docs/release-checklist.md) — Pre-flight quality gates, coverage metrics, and validation matrix.
- [SBOM & Dependency Audit](file:///docs/sbom-and-dependency-audit.md) — Software bill of materials and CVE-2025-49596 inspector review.
- [System Limitations & Threat Boundaries](file:///docs/limitations.md) — Small-N statistical caveats, threat model boundaries, and OS concurrency semantics.
- [Migration Guide](file:///docs/operations/migration-guide.md) — Schema upgrades, index rebuilding, and corrupted JSONL recovery.
- [Evaluation & Benchmarks](file:///docs/evaluation/benchmark-results.md) — Benchmark protocol, baselines B0-B3, Wilcoxon signed-rank tests, and ablation analysis.

## License

MIT
