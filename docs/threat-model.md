# Threat Model — agent-memory-mcp

**Version:** 1.0  
**Date:** 2026-09-10  
**Status:** Authoritative  
**Methodology:** STRIDE-per-Element & OWASP Top 10 for LLM Applications (2025/2026)  

---

## 1. System Boundary & Assets

### System Boundary
- **Inside Boundary:**
  - MCP Server process running via `stdio` (JSON-RPC).
  - Memory persistence directory `.agent-memory/` (`records.jsonl`, `index.db`, `logs.jsonl`, `approvals-*.jsonl`).
  - Redaction, normalization, fingerprinting, and retrieval scoring engines.
  - Dashboard Bridge & Web Console (`localhost:4321`, separate Node process).
- **Outside Boundary:**
  - MCP Host (Cursor, Claude Desktop, VS Code extension).
  - External Git repository and remotes.
  - Operating system shell and package registries (NPM, PyPI, Cargo).

### Critical Assets
1. **Developer Workstation Security:** Integrity of local filesystem, processes, and network.
2. **Secrets & Credentials:** API keys, cloud tokens, personal access tokens (PATs), SSH keys.
3. **Memory Store Integrity:** `records.jsonl` correctness, non-tampering, absence of malicious injection payloads.
4. **Agent Context Integrity:** Preventing prompt injection or malicious instructions from hijacking the host LLM.

---

## 2. Threat Actors & Attack Vectors

| Actor | Capability / Motivation | Attack Vector |
| :--- | :--- | :--- |
| **Malicious Package / Dependency** | Injects malicious output into stdout/stderr during build/test scripts. | Error output poisoning stored in `records.jsonl`. |
| **Untrusted Repository Contributor** | PR author modifying `.agent-memory/records.jsonl` or committing poisoned memory. | Injected malicious commands or prompt injection in `fix.explanation`. |
| **Compromised MCP Client / Tool** | Rogue extension or prompt-injected LLM calling MCP tools maliciously. | Excessive data exfiltration via `find_fix`, arbitrary command execution via `verify_fix`. |
| **Local Network Attacker** | Attacker on local network attempting to probe local services. | Probing dashboard bridge port (mitigated by localhost-only binding and read-only IPC). |

---

## 3. STRIDE Analysis & Mitigations

### 3.1 Spoofing (S)
- **Threat:** Malicious process impersonates the MCP server or tampers with records attributed to another developer.
- **Mitigation:**
  - Communication is locked to local stdio pipes established by the parent process (MCP host).
  - Provenance tracking records local Git commit hash, Git user signature, and timestamp. Records lacking valid local provenance are assigned lower trust weights.

### 3.2 Tampering (T)
- **Threat:** Direct modification or corruption of `.agent-memory/records.jsonl` or SQLite `index.db`.
- **Mitigation:**
  - Append-only atomic writes with write locks (`records.jsonl`).
  - SQLite database is treated as an ephemeral, rebuildable index (ADR-003). On mismatch or corruption, the index is automatically rebuilt from JSONL.
  - JSON Schema validation on every record before reading and writing.

### 3.3 Repudiation (R)
- **Threat:** Developer denies executing a dangerous remediation command or inserting a broken fix.
- **Mitigation:**
  - Structured, immutable audit trail written to `logs.jsonl`.
  - Approvals workflow logs who approved what command with timestamp and hash in `approvals-resolved.jsonl`.

### 3.4 Information Disclosure (I)
- **Threat:** Storing secrets, passwords, or API keys in `records.jsonl` and returning them via MCP tools or committing them to Git.
- **Mitigation:**
  - Multi-tier synchronous redaction pipeline before any persistence (ADR-005):
    - Layer 1: Pattern regexes for GitHub, AWS, OpenAI, Anthropic, JWT, PEM, connection URIs.
    - Layer 2: Shannon entropy scoring for high-entropy tokens.
  - Standard `.gitignore` templates recommend committing `records.jsonl` only after review, and explicitly ignoring `.agent-memory/*.db`, `logs.jsonl`, and pending approvals.

### 3.5 Denial of Service (D)
- **Threat:** Giant error outputs (e.g. 50MB minified stack trace) causing memory exhaustion or regex catastrophic backtracking (ReDoS).
- **Mitigation:**
  - Max raw output payload cap (e.g. 64KB). Outputs exceeding the cap are truncated before processing.
  - Linear-time / bounded regular expressions; no nested quantifiers.
  - Bounded retrieval queries: SQLite FTS5 queries enforce `LIMIT 10` and strict execution timeouts.

### 3.6 Elevation of Privilege (E)
- **Threat:** An agent executes malicious commands via `verify_fix` or is hijacked via Persisted-Retrieval Poisoning.
- **Mitigation:**
  - Command Execution Policy (ADR-006): Dry-run by default, strict command allowlist (no arbitrary shell scripts), workspace boundary enforcement.
  - Persisted-Retrieval Poisoning Defense (ADR-009): Sanitization envelopes around untrusted outputs, heuristic flagging for prompt injection tokens, and provenance-weighted trust decay.

---

## 4. Security Verification Checklist

- [x] Stdio transport ensures no open network ports for the MCP server core.
- [x] Dashboard bridge binds strictly to `127.0.0.1` and opens SQLite in read-only mode.
- [x] Zero raw outputs logged to stdout (stdio JSON-RPC channel integrity preserved).
- [x] Multi-tier secret redaction runs before fingerprinting or persistence.
- [x] All returned memories wrapped in sanitization XML envelopes.
- [x] Commands restricted to whitelist, and dry-run is required unless explicit human approval is resolved.
