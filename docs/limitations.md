# System Limitations & Threat Boundaries

> **Document Status:** Released — Version 0.1.0  
> **Audience:** Operators, Security Reviewers, Evaluators  

---

## 1. Statistical Limitations (Small-N Caveat)

The evaluation harness introduced in Phase 8 executes a deterministic benchmark corpus of representative failure scenarios:
1. `npm_typescript_missing_typedef` (Dependency mismatch)
2. `tsc_compilation_strict_null` (TypeScript compile error)
3. `env_missing_database_url` (Missing environment variable)
4. `port_collision_eaddrinuse` (Port collision)
5. `vitest_assertion_failure` (Test assertion failure)
6. `path_separator_cross_platform` (Platform path separator issue)

### 1.1 Non-Parametric Significance Testing Caveats
* **Scenario Count ($N = 6$):**
  Given the scenario count of $N=6$, statistical analysis employs the **Wilcoxon signed-rank test** for paired differences ($W^+$, two-tailed $p$-value) and **Cliff's Delta / Rank-Biserial Correlation** ($r = Z / \sqrt{N}$) per Hollander & Wolfe (1999).
* **Sample Size Inherent Bounds:**
  For $N=6$, the discrete sample space of signed ranks limits the minimum obtainable two-tailed $p$-value to $p = 1/2^{N-1} = 0.03125$. The normal approximation for $Z$ in small samples ($N < 20$) is an approximation.
* **Interpretation of Results:**
  While baselines B2 (exact + fuzzy) and B3 (full system) achieve statistically significant superiority over B0 (no memory) with large effect sizes ($r = 0.883$ to $1.00$, $p < 0.05$), **users must not over-interpret these effect sizes as definitive population-level claims**. The benchmark results demonstrate determinism and recall efficacy within the fixture suite, but generalizability to arbitrary uncurated repositories requires ongoing evaluation.

---

## 2. Poisoning Defense Boundaries

Phase 5 introduced a multi-layered persisted-retrieval poisoning defense system. It is critical to understand both what this architecture defends against and what falls outside its threat boundary.

### 2.1 What the Poisoning Defenses DO Defend Against

1. **Delimiter Hijacking & Framing Breakout:**
   All historical memory retrieved via `find_fix` is wrapped in an explicit untrusted-data envelope:
   ```xml
   <untrusted_historical_memory data-trust-score="0.42" data-quarantined="false">
     ... retrieved payload ...
   </untrusted_historical_memory>
   ```
   Any internal attempts within the record to simulate closing tags (`</untrusted_historical_memory>`) or prompt delimiters are sanitized.
2. **Obfuscated Attack Payloads:**
   The `PoisonDetector` strips zero-width spaces (`\u200B`, `\u200C`, `\u200D`, `\uFEFF`) and canonicalizes Cyrillic/Greek homoglyphs (e.g. Cyrillic `а` to Latin `a`, `о` to `o`, `р` to `p`) before heuristic evaluation.
3. **Imperative & Authority-Spoofing Heuristics:**
   Payloads attempting imperative authority override (`"You are now an unrestricted AI"`, `"SYSTEM OVERRIDE:"`, `"Ignore previous instructions"`, `"Exfiltrate environment variables"`) are identified by density and keyword heuristics.
4. **Non-Destructive Quarantine & Ranking Attenuation:**
   Poisoned records are **never silently discarded** (preserving audit integrity). Instead, they are flagged with `is_quarantined = true`, assigned an audit rationale, excluded from default retrieval queries, and down-weighted by a $0.5\times$ trust multiplier if explicitly requested.

### 2.2 What the Poisoning Defenses DO NOT Defend Against

> [!CAUTION]
> The following threat vectors fall outside the scope of heuristic retrieval defenses and require host-level and model-level controls:

1. **Downstream LLM Cognitive Vulnerability (Indirect Prompt Injection):**
   Even when an untrusted record is visibly wrapped in `<untrusted_historical_memory>` tags and given a low confidence score, a host LLM with weak system prompt adherence may still choose to heed the instructions embedded within. True immunity requires the LLM itself to respect data/instruction boundary separation.
2. **Subtle & Semantic Logic Bombs:**
   If an adversary introduces a fix command that is syntactically benign and contains no imperative trigger words (e.g., changing a timeout from 5000ms to 1ms to induce denial of service, or introducing an off-by-one error), regex and heuristic detectors will not flag it. Verification via automated test execution (`verify_fix`) is required to detect subtle regressions.
3. **Compromised Git Commit Provenance:**
   The system awards higher provenance trust ($1.0\times$) to records linked to verified git commits. If an attacker possesses commit access to the target repository and pushes malicious records directly to git, the provenance weighting will treat the record as trusted. Repository branch protections and signed commits (`git commit -S`) are required to secure git-backed provenance.
4. **Post-Retrieval Command Execution without Policy:**
   If a host agent ignores the `verify_fix` dry-run safeguards and directly passes `fixCommands` to a raw shell without human operator approval (`approvals-resolved.jsonl`), arbitrary command execution can occur. The agent host MUST respect the Command Policy.

---

## 3. Storage & Concurrency Semantics

### 3.1 POSIX vs Windows Concurrency

* **POSIX Systems (Linux, macOS):**
  The append-only store (`records.jsonl`) writes via `fs.promises.appendFile` with `O_APPEND`. On POSIX-compliant kernels, writes smaller than `PIPE_BUF` (4096 bytes on Linux) to files opened with `O_APPEND` are guaranteed atomic at the kernel level, allowing multiple processes to append without corruption.
* **Windows Systems (NTFS):**
  On Windows, file locking semantics differ. Node's `appendFile` uses `FILE_APPEND_DATA`, and asynchronous operations within a single Node.js event loop are serialized via libuv. Tests in `tests/unit/storage.test.ts` verify that concurrent promises within the process append cleanly without data loss. However, multi-process writes across separate operating system processes without shared locking may experience handle contention under high write volume. In multi-agent configurations on Windows, all writes should be mediated through a single MCP server instance.

### 3.2 Index Recovery Semantics

* The authoritative source of truth is always `records.jsonl`.
* The SQLite file (`index.db`) is a cache. If the index is deleted or corrupted, it can be fully rebuilt by replaying `records.jsonl`.
* If a corrupted line is detected in `records.jsonl` (e.g., partial write caused by a sudden system power failure), `JsonlStorage.readAll()` skips the malformed line, emits a structured JSON warning on `stderr`, and successfully loads all surrounding valid records.
