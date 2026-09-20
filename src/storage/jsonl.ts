/**
 * JSONL storage: Append-only persistent store.
 * ADR-002 compliant.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { MemoryRecord } from '../types.js';

export class JsonlStorage {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Appends a record atomically to the JSONL file.
   */
  async append(record: MemoryRecord): Promise<void> {
    const line = JSON.stringify(record) + '\n';
    await fs.promises.appendFile(this.filePath, line, { encoding: 'utf8' });
  }

  /**
   * Reads all records from the JSONL file.
   * Corrupted lines (invalid JSON) are skipped with a stderr warning.
   * Recovery: re-run the SQLite index rebuild from valid lines only.
   */
  async readAll(): Promise<MemoryRecord[]> {
    if (!fs.existsSync(this.filePath)) {
      return [];
    }
    const content = await fs.promises.readFile(this.filePath, 'utf8');
    const lines = content.split('\n').filter((line) => line.trim().length > 0);
    const records: MemoryRecord[] = [];
    for (let i = 0; i < lines.length; i++) {
      try {
        records.push(JSON.parse(lines[i] ?? '') as MemoryRecord);
      } catch {
        // CORRUPTED LINE: log to stderr (never stdout) and skip.
        // The SQLite index remains authoritative; re-index by re-reading valid records.
        process.stderr.write(
          JSON.stringify({
            level: 'warn',
            event: 'jsonl_corrupted_line',
            file: this.filePath,
            lineNumber: i + 1,
            preview: (lines[i] ?? '').slice(0, 80),
            recovery: 'line skipped; re-run index rebuild from valid lines',
          }) + '\n',
        );
      }
    }
    return records;
  }
}
