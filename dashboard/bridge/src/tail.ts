/**
 * Log tailing utility for Server-Sent Events (SSE) live feed.
 * Watches .agent-memory/logs.jsonl and streams structured JSON events.
 */

import fs from 'node:fs';
import readline from 'node:readline';

export interface LogEvent {
  level?: number;
  time?: string;
  pid?: number;
  event?: string;
  repo?: string;
  command?: string;
  fingerprint?: string;
  matchCount?: number;
  status?: string;
  quarantined?: boolean;
  msg?: string;
  [key: string]: unknown;
}

export class LogTailer {
  private logFilePath: string;
  private listeners: Set<(event: LogEvent) => void> = new Set();
  private recentEvents: LogEvent[] = [];
  private maxRecent = 100;
  private currentSize = 0;
  private watcher: fs.FSWatcher | null = null;

  constructor(logFilePath: string) {
    this.logFilePath = logFilePath;
    this.init();
  }

  private init() {
    if (fs.existsSync(this.logFilePath)) {
      this.readInitial();
      this.watch();
    } else {
      // Check periodically for log file creation
      const checkInterval = setInterval(() => {
        if (fs.existsSync(this.logFilePath)) {
          clearInterval(checkInterval);
          this.readInitial();
          this.watch();
        }
      }, 1000);
      checkInterval.unref?.();
    }
  }

  private readInitial() {
    try {
      const stats = fs.statSync(this.logFilePath);
      this.currentSize = stats.size;

      const content = fs.readFileSync(this.logFilePath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line) as LogEvent;
          this.recentEvents.push(parsed);
          if (this.recentEvents.length > this.maxRecent) {
            this.recentEvents.shift();
          }
        } catch {
          // Ignore invalid JSON lines
        }
      }
    } catch (err) {
      console.error('Error reading initial logs:', err);
    }
  }

  private watch() {
    try {
      this.watcher = fs.watch(this.logFilePath, () => {
        this.readNewBytes();
      });
    } catch (err) {
      console.error('Error watching log file:', err);
    }
  }

  private readNewBytes() {
    try {
      if (!fs.existsSync(this.logFilePath)) return;
      const stats = fs.statSync(this.logFilePath);
      if (stats.size <= this.currentSize) {
        if (stats.size < this.currentSize) {
          // File was truncated / rotated
          this.currentSize = 0;
        } else {
          return;
        }
      }

      const stream = fs.createReadStream(this.logFilePath, {
        start: this.currentSize,
        end: stats.size,
        encoding: 'utf8',
      });

      this.currentSize = stats.size;

      const rl = readline.createInterface({ input: stream });
      rl.on('line', (line) => {
        if (!line.trim()) return;
        try {
          const event = JSON.parse(line) as LogEvent;
          this.recentEvents.push(event);
          if (this.recentEvents.length > this.maxRecent) {
            this.recentEvents.shift();
          }
          for (const listener of this.listeners) {
            listener(event);
          }
        } catch {
          // ignore parse errors
        }
      });
    } catch (err) {
      console.error('Error reading new log bytes:', err);
    }
  }

  getRecentEvents(): LogEvent[] {
    return [...this.recentEvents];
  }

  subscribe(listener: (event: LogEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  close() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.listeners.clear();
  }
}
