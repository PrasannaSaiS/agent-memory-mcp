# ADR-003: SQLite as Rebuildable Index — node:sqlite (built-in)

**Status:** Accepted
**Date:** 2026-09-10
**Deciders:** Project team

---

## Context

We need fast random-access lookup on fingerprint (exact) and text similarity (fuzzy) over potentially thousands of records, without requiring a hosted database. JSONL sequential scan is acceptable for small corpora but becomes a bottleneck at 10k+ records for p95 < 100 ms targets.

### Options evaluated

| Option | Build complexity | Speed | Portability | Decision |
|---|---|---|---|---|
| `better-sqlite3` | Requires native build (C++ toolchain, Windows SDK) | Fast | Low — failed on Node 24 + VS BuildTools without Windows SDK | **Rejected** |
| `node:sqlite` (built-in, Node ≥22.5) | Zero — built into Node.js runtime | Same synchronous API as better-sqlite3 | High — no native build | **Chosen** |
| SQLite WASM | Non-trivial bundling | Slower (WASM overhead) | High | Fallback option if node:sqlite proves insufficient |
| Pure file index (JSON) | Zero | Slow at scale | High | Acceptable only for < 1k records |

### Why `node:sqlite` was chosen over `better-sqlite3`

During the Phase 1 scaffold, `better-sqlite3` failed to install on the development machine (Node 24.11.0, Windows 11, VS BuildTools 2022 without Windows SDK). This is exactly the portability risk the implementation kit flagged. The project is running Node 24.11.0 which ships `node:sqlite` as a stable built-in. Switching eliminates the native-build dependency entirely with no API surface regression — the `node:sqlite` API is modelled on the same synchronous interface.

**This decision is recorded as a binding ADR** rather than an incidental fix, because it affects:
- The storage interface in `src/storage/index.ts`
- The dashboard bridge (which also reads the SQLite index)
- CI setup (no `node-gyp` required)
- Any future contributor onboarding

## Decision

**Use `node:sqlite` (Node.js built-in module, requires Node ≥ 22.5.0) for the SQLite index.**

The index is:
- **Gitignored** — disposable, not the source of truth.
- **Rebuilt on startup** if missing, schema-mismatched, or flagged corrupt.
- **Accessed synchronously** — `node:sqlite` provides a synchronous API consistent with the MCP server's event-loop model.

### Schema (Phase 1 draft — update via new ADR on any change)

```sql
CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  command TEXT NOT NULL,
  command_family TEXT NOT NULL,  -- e.g. "npm", "cargo", "go"
  exit_code INTEGER NOT NULL,
  repository_id TEXT NOT NULL,
  created_at TEXT NOT NULL,      -- ISO-8601
  normalizer_version INTEGER NOT NULL,
  verification_status TEXT NOT NULL,
  is_stale INTEGER NOT NULL DEFAULT 0,
  poisoning_flag TEXT,           -- NULL or JSON
  schema_version INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fingerprint ON records(fingerprint);
CREATE INDEX IF NOT EXISTS idx_repo_family ON records(repository_id, command_family);
CREATE INDEX IF NOT EXISTS idx_created_at ON records(created_at);

-- FTS5 virtual table for fuzzy text search (Phase 3)
CREATE VIRTUAL TABLE IF NOT EXISTS records_fts USING fts5(
  id UNINDEXED,
  normalized_output,
  content=records,
  content_rowid=rowid
);
```

### Index rebuild protocol

```
1. On startup: open records.jsonl, read schema-version file
2. If *.db missing OR index.schema_version != file.schema_version: rebuild
3. Rebuild: stream JSONL line-by-line, skip malformed with warning, upsert each record
4. Write index.schema_version after successful rebuild
5. If rebuild fails mid-way: delete partial .db, log FATAL to stderr, continue with JSONL-only fallback
```

## Consequences

- `engines.node` is `>=22.5.0` in `package.json`.
- `import { DatabaseSync } from 'node:sqlite'` — no npm dependency.
- The storage interface (`IRecordIndex`) abstracts the implementation; tests use an in-memory instance.
- The dashboard bridge reads the same `.db` file in read-only mode via `node:sqlite`.
- `better-sqlite3` is permanently excluded from both the server and bridge packages. This is a binding decision; re-opening it requires a new ADR demonstrating the Windows build problem is resolved.
