# Operations Guide

## stdout / stderr Behavior

### Invariant
stdout carries **JSON-RPC 2.0 framing only**. Writing any non-JSON-RPC bytes to stdout will corrupt the MCP session and cause the host to disconnect or crash.

### Where logs go
| Destination | Content | Format |
|---|---|---|
| **stderr** | All structured application logs | JSON lines (pino) |
| **`.agent-memory/logs.jsonl`** | Same logs persisted for the dashboard | JSON lines |

### Log schema (each line)
```json
{
  "level": 30,
  "time": 1726200000000,
  "event": "record_stored",
  "recordId": "uuid-v4",
  "fingerprint": "sha256:abcdef...",
  "msg": "Human-readable message"
}
```

Common `event` values: `server_started`, `record_stored`, `record_quarantined`,
`find_fix_result`, `verify_fix_dry_run`, `verify_fix_executed`, `tool_call_error`,
`jsonl_corrupted_line`.

---

## Corrupted JSONL Recovery

A corrupted JSONL line (truncated write, disk full, process killed mid-write) causes
`readAll()` to **skip that line** and emit a `jsonl_corrupted_line` warning to stderr.

### Symptoms
- `list_memory_stats` returns a count lower than expected.
- Dashboard Record Browser shows fewer records than historical logs indicate.
- stderr contains `"event":"jsonl_corrupted_line"` with a `lineNumber` and `preview`.

### Recovery steps

1. **Identify corrupted lines**:
   ```bash
   # Print invalid JSON lines with line numbers
   awk '{line=NR; ok=1; if (!match($0, /^\{/)) ok=0} ok==0 {print NR": "$0}' \
     .agent-memory/records.jsonl
   ```

2. **Isolate good lines** (do not delete the original):
   ```bash
   cp .agent-memory/records.jsonl .agent-memory/records.jsonl.bak
   node -e "
     const fs = require('fs');
     const lines = fs.readFileSync('.agent-memory/records.jsonl','utf8').split('\n');
     const good = lines.filter(l => { try { JSON.parse(l); return true; } catch { return false; } });
     fs.writeFileSync('.agent-memory/records.jsonl', good.join('\n') + '\n');
     console.log('Kept', good.length, 'of', lines.length, 'lines');
   "
   ```

3. **Rebuild the SQLite index** (the index is a rebuildable secondary — source of truth is JSONL):
   ```bash
   rm .agent-memory/index.db
   # Restart the MCP server — it rebuilds the index on startup from records.jsonl
   ```

4. **Verify**:
   Call `list_memory_stats` and confirm the count matches the preserved record count.

### Prevention
- Use the server's atomic `append()` method — never write to `records.jsonl` directly.
- Set `AGENT_MEMORY_DIR` to a path on a journalled filesystem (ext4, APFS, NTFS).
- Do not kill the server process with SIGKILL during an active `record_failure` call.

---

## Dashboard Bridge Isolation

The `dashboard-bridge` process:
- Opens SQLite in **read-only mode** (`readOnly: true`).
- Contains zero `child_process`, `exec`, or `spawn` calls.
- Binds to `127.0.0.1:4321` only — never `0.0.0.0`.
- The single permitted write path is appending operator decisions to
  `approvals-resolved.jsonl`.

The bridge **cannot** write to the MCP server stdout, and the MCP server does not read from the bridge. They share only the filesystem (`.agent-memory/`).

---

## Graceful Shutdown

The MCP SDK handles `SIGTERM`/`SIGINT`. On shutdown:
1. In-flight `record_failure` calls complete their JSONL append before the process exits.
2. SQLite WAL is flushed automatically by `DatabaseSync.close()`.
3. Any pending `verify_fix` execution is cancelled (the `AbortController` fires).

If the server is force-killed (`SIGKILL`):
- An in-progress JSONL append may produce a truncated last line → follow the corrupted JSONL recovery steps above.
- The SQLite WAL is recoverable on next open (WAL mode is crash-safe).
