# ADR-005: Redaction Strategy — Layered Pattern Matching and Shannon Entropy Detection

**Status:** Accepted  
**Date:** 2026-09-10  
**Deciders:** Project team  

---

## Context

Failure output from builds, test runners, package managers, and runtimes frequently captures sensitive data:
- API keys, personal access tokens (GitHub, NPM, AWS, GCP, Slack, OpenAI, Anthropic)
- Basic auth credentials in URLs (`https://user:pass@host/`)
- JWTs, bearer tokens, private keys (PEM format), and SSH keys
- Environment variable values dumped by debugging flags or stack traces
- Absolute file paths revealing developer usernames or internal infrastructure

Persisting these secrets in `.agent-memory/records.jsonl` risks committing secrets to git repositories, leaking credentials through MCP tools to LLMs, or exposing them on developer dashboards.

Simple single-regex redaction is insufficient: secrets often follow high-entropy pseudorandom formats without predictable static prefixes.

## Decision

We adopt a two-tier redaction pipeline applied to all raw command outputs prior to normalization, hashing, or persistence:

### Tier 1: Deterministic Pattern Redaction
High-precision regular expressions targeting well-known token formats and credential idioms:
1. **Vendor Token Prefixes:**
   - GitHub (`ghp_`, `gho_`, `ghu_`, `ghs_`, `ghr_`)
   - NPM (`npm_`)
   - AWS Access Key (`AKIA[0-9A-Z]{16}`)
   - Slack tokens (`xox[baprs]-([0-9a-zA-Z]{10,48})`)
   - OpenAI API keys (`sk-[a-zA-Z0-9]{20,}`)
   - Anthropic API keys (`sk-ant-[a-zA-Z0-9]{20,}`)
   - Generic Bearer tokens and Authorization headers
2. **Cryptographic Structures:**
   - PEM private key blocks (`-----BEGIN [A-Z ]+PRIVATE KEY-----...-----END [A-Z ]+PRIVATE KEY-----`)
   - JSON Web Tokens (`ey[A-Za-z0-9-_=]+\.ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*`)
3. **URIs and Connection Strings:**
   - Embedded credentials: `[a-zA-Z]+:\/\/[^\s:@]+:[^\s:@]+@[^\s]+` -> replaced with `[REDACTED_CREDENTIALS]`
4. **Environment and CLI flags:**
   - Common patterns like `--password=<val>`, `-p <val>`, `SECRET=<val>`, `TOKEN=<val>`

### Tier 2: Shannon Entropy Analysis
For suspicious alphanumeric tokens (length between 20 and 128 characters) that do not match a specific pattern:
- Calculate Shannon entropy: $H(X) = -\sum_{i=1}^n P(x_i) \log_2 P(x_i)$
- Base64 charset threshold: $H \ge 4.5$ bits/char
- Hexadecimal charset threshold: $H \ge 3.0$ bits/char
- Exclude known common hashes (like git commit SHAs or package lock integrity hashes) unless associated with an assignment or auth context.
- High-entropy tokens are replaced with `[REDACTED_ENTROPY_TOKEN]`.

### Redaction Invariant
- Redaction executes **synchronously** in memory before any data reaches SQLite or JSONL.
- Raw, unredacted failure strings are **never written to disk or stdout/stderr**.
- Redacted tokens are preserved across normalization passes so fingerprinting operates consistently on scrubbed text.

## Consequences

- **Positive:** Low false-negative rate for secret leakage into committed memory files.
- **Positive:** High auditability: developers can inspect `[REDACTED_*]` markers in records.
- **Negative:** False positives may occasionally redact innocent random hashes or UUIDs; tuned entropy thresholds and character class heuristics mitigate this.
