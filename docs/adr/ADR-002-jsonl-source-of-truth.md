# ADR-002: JSONL as Source of Truth

**Status:** Accepted
**Date:** 2026-09-10
**Deciders:** Project team

---

## Context

We need a persistent store for failure-fix records that:
- Is human-readable and auditable (reviewable before committing team knowledge)
- Supports git-based team synchronization
- Survives crash without corruption
- Allows concurrent writers from different processes
- Enables offline reproducibility (no hosted DB required)

## Decision

**Use append-only newline-delimited JSON (JSONL) as the canonical source of truth** stored at `.agent-memory/records.jsonl`.

### Rationale

| Property | JSONL | Alternatives |
|---|---|---|
| Human-readable diffs | ✅ One record per line = one git diff chunk | SQLite: binary, not diffable |
| Git-friendly merge | ✅ Append-only = no conflicts on add; conflicts only if records edited | SQLite: binary merge conflicts |
| Crash safety | ✅ Atomic write (temp→rename); partial writes detectable | SQLite WAL mode needed; more complex |
| Offline / zero-dep | ✅ Plain file | SQLite WASM adds bundle complexity; remote DB adds hosting |
| Sequential scan | ✅ Fast enough for rebuild; index handles hot-path queries | — |
| Random access | ❌ Requires index rebuild for lookup | Mitigated by SQLite index |
| Concurrent writes | ⚠️ POSIX: advisory flock; Windows: see caveat below | SQLite handles concurrency natively |

### Atomic write protocol

```
1. Generate record in memory (fully validated, redacted)
2. Write to .agent-memory/.records-<uuid>.tmp
3. fsync the temp file
4. fs.rename(.tmp → append to records.jsonl) — NOT atomic cross-file;
   instead: open records.jsonl with O_APPEND, write single-line JSON + newline, fsync
5. If interrupted: temp file is left; on startup, detect and remove .tmp files
```

For O_APPEND single-line writes, POSIX guarantees atomicity for writes up to PIPE_BUF (≥512 bytes). Records exceeding this threshold use the advisory-lock path.

### Windows concurrent-writer caveat

Windows does not support POSIX `flock`. For the MVP:
- Concurrent writers on Windows are **not safe** without an additional mutex.
- **Scope claim:** concurrent-writer correctness is guaranteed on POSIX only in v1.
- The README and this ADR state this explicitly.
- A Windows-compatible write lock (using a `.lock` file and polling) is documented as v2 work.
- The CI suite includes a Windows concurrent-writer test that is **expected to be skipped** unless the lock file strategy is implemented (see Phase 7).

### Malformed line recovery

A malformed line (truncated write, manual edit) is skipped during index rebuild with a logged warning. The repair script (`scripts/validate-memory.ts`) identifies and optionally quarantines malformed lines. The healthy remainder of the file is always recoverable.

## Consequences

- `src/storage/jsonl.ts` implements append + O_APPEND + flock (POSIX) or polled-lock (Windows v2).
- `.agent-memory/records.jsonl` is git-tracked. Contributors must review diffs for accidental secrets before committing (pre-commit hook in Phase 7).
- SQLite index is always rebuilable from JSONL — it is gitignored.
- Record deletion is NOT a raw file edit — use the deletion command which appends a `{type:"delete", id:...}` tombstone record and rebuilds the index.
