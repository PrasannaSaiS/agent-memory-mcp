/**
 * Structured JSON Logger for agent-memory-mcp.
 * Directs logs to stderr AND .agent-memory/logs.jsonl.
 * NEVER writes to stdout (preserves MCP stdio JSON-RPC protocol framing).
 */

import { pino, type DestinationStream } from 'pino';
import fs from 'node:fs';
import path from 'node:path';

export interface LoggerOptions {
  logFilePath?: string;
  level?: string;
}

export function createMemoryLogger(options: LoggerOptions = {}) {
  const level = options.level ?? process.env.LOG_LEVEL ?? 'info';

  const streams: DestinationStream[] = [
    // Destination 1: stderr
    process.stderr,
  ];

  // Destination 2: log file (.agent-memory/logs.jsonl)
  if (options.logFilePath) {
    const dir = path.dirname(options.logFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const dest = pino.destination({
      dest: options.logFilePath,
      sync: true,
      mkdir: true,
    });
    streams.push(dest);
  }

  return pino(
    {
      level,
      timestamp: pino.stdTimeFunctions.isoTime,
      base: {
        pid: process.pid,
      },
    },
    pino.multistream(streams),
  );
}

export type MemoryLogger = ReturnType<typeof createMemoryLogger>;
