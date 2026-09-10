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
   */
  async readAll(): Promise<MemoryRecord[]> {
    if (!fs.existsSync(this.filePath)) {
      return [];
    }
    const content = await fs.promises.readFile(this.filePath, 'utf8');
    const lines = content.split('\n').filter((line) => line.trim().length > 0);
    return lines.map((line) => JSON.parse(line) as MemoryRecord);
  }
}
