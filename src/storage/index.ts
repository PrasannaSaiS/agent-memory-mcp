/**
 * SQLite as rebuildable secondary index using node:sqlite DatabaseSync.
 * ADR-003 compliant.
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import type { MemoryRecord } from '../types.js';

export class SqliteIndex {
  private db: DatabaseSync;

  constructor(dbPath: string) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new DatabaseSync(dbPath);
    this.init();
  }

  private init(): void {
    // Enable WAL mode for high concurrency
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;

      CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY,
        fingerprint TEXT NOT NULL,
        command TEXT NOT NULL,
        exit_code INTEGER NOT NULL,
        repository_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        normalizer_version INTEGER NOT NULL,
        is_quarantined INTEGER NOT NULL DEFAULT 0,
        data TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_records_fingerprint ON records(fingerprint);
      CREATE INDEX IF NOT EXISTS idx_records_repo ON records(repository_id);
    `);
  }

  indexRecord(record: MemoryRecord): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO records (
        id, fingerprint, command, exit_code, repository_id, created_at, normalizer_version, is_quarantined, data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const isQuarantined = record.poisoningFlag !== null ? 1 : 0;
    stmt.run(
      record.id,
      record.fingerprint,
      record.command,
      record.exitCode,
      record.repositoryId,
      record.createdAt,
      record.normalizerVersion,
      isQuarantined,
      JSON.stringify(record),
    );
  }

  findByFingerprint(fingerprint: string, includeQuarantined = false): MemoryRecord | null {
    let sql = 'SELECT data FROM records WHERE fingerprint = ?';
    if (!includeQuarantined) {
      sql += ' AND is_quarantined = 0';
    }
    sql += ' ORDER BY created_at DESC LIMIT 1';

    const stmt = this.db.prepare(sql);
    const row = stmt.get(fingerprint) as { data: string } | undefined;
    if (!row) {
      return null;
    }
    return JSON.parse(row.data) as MemoryRecord;
  }

  getStats(repositoryId?: string): {
    total: number;
    exactFingerprints: number;
    quarantined: number;
  } {
    let countSql =
      'SELECT COUNT(*) as total, COUNT(DISTINCT fingerprint) as distinctFps, SUM(is_quarantined) as quarantined FROM records';
    if (repositoryId) {
      countSql += ' WHERE repository_id = ?';
      const stmt = this.db.prepare(countSql);
      const row = stmt.get(repositoryId) as
        | { total: number; distinctFps: number; quarantined: number | null }
        | undefined;
      return {
        total: row?.total ?? 0,
        exactFingerprints: row?.distinctFps ?? 0,
        quarantined: row?.quarantined ?? 0,
      };
    } else {
      const stmt = this.db.prepare(countSql);
      const row = stmt.get() as
        | { total: number; distinctFps: number; quarantined: number | null }
        | undefined;
      return {
        total: row?.total ?? 0,
        exactFingerprints: row?.distinctFps ?? 0,
        quarantined: row?.quarantined ?? 0,
      };
    }
  }

  close(): void {
    this.db.close();
  }
}
