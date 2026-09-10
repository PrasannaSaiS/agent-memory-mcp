# ADR-004: Normalization Versioning

**Status:** Accepted
**Date:** 2026-09-10
**Deciders:** Project team

---

## Context

Error output normalization is an evolving process: regex patterns will be added, corrected, or removed as new failure types are encountered. If we change the normalization logic without tracking versions:
- Old fingerprints become incompatible with new ones (same logical error → different hash)
- Fuzzy scoring becomes unreliable across version boundaries
- Stale records cannot be distinguished from "different error" records

## Decision

**Embed an integer `normalizerVersion` in both the fingerprint and the stored record. Increment on any regex or transformation change.**

### Fingerprint construction

```
fingerprint = "sha256:" + sha256(
  normalizerVersion.toString()
  + "\0"
  + commandClass           // coarse category: "npm", "cargo", "tsc", "pytest", ...
  + "\0"
  + normalizedErrorText
)
```

Encoding the version into the fingerprint ensures that records normalized with different versions are **guaranteed not to collide** on exact lookup. This is intentional: a version bump invalidates prior exact matches, forcing them through the fuzzy path with explicit stale detection.

### Transformation pipeline (v1)

Each stage is independently testable with regression fixtures:

| Stage | Transformation | Fixture file |
|---|---|---|
| 1 | Unicode NFC normalization + LF line endings + trim | `tests/fixtures/normalization/unicode.jsonl` |
| 2 | Size cap (max 32 KiB per field) | `tests/fixtures/normalization/size-cap.jsonl` |
| 3 | Redact secrets (pattern + entropy) | `tests/fixtures/redaction/` (separate corpus) |
| 4 | Replace timestamps → `<TIMESTAMP>` | `tests/fixtures/normalization/timestamps.jsonl` |
| 5 | Replace UUIDs → `<UUID>` | `tests/fixtures/normalization/uuids.jsonl` |
| 6 | Replace absolute paths → `<ABSPATH>` | `tests/fixtures/normalization/paths.jsonl` |
| 7 | Replace hex addresses → `<ADDR>` | `tests/fixtures/normalization/addresses.jsonl` |
| 8 | Replace line:col → `<LINECOL>` | `tests/fixtures/normalization/linenum.jsonl` |
| 9 | Replace PIDs → `<PID>` | `tests/fixtures/normalization/pids.jsonl` |
| 10 | Replace temp dir paths → `<TMPDIR>` | `tests/fixtures/normalization/tmpdirs.jsonl` |
| 11 | Preserve: package names, error codes, exception class names, adjacent context | — |

### Version bump protocol

1. Increment `NORMALIZER_VERSION` constant in `src/core/normalize.ts`.
2. Add regression fixtures demonstrating the corrected behavior.
3. Write a migration note in `docs/operations/migration-guide.md` explaining which records become stale.
4. On next server start, the staleness checker marks records with `normalizerVersion < current` as stale.
5. Update this ADR with a changelog entry.

### Changelog

| Version | Date | Change |
|---|---|---|
| 1 | 2026-09-10 | Initial: stages 1–11 as above |

## Consequences

- `NORMALIZER_VERSION` is a compile-time constant; changing it is a breaking change requiring a test update.
- Records with an older `normalizerVersion` are never silently re-fingerprinted — they remain stale.
- Property tests verify that normalization is **deterministic** (same input → same output across runs).
- Over-normalization (different errors → same hash) and under-normalization (same error → multiple hashes) are measured via a fixture-based benchmark in Phase 3.
