import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { server, shutdown } from '../../src/server.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

describe('Server Tool Error Handling & Graceful Shutdown', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-shutdown-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it('formats unknown tool calls as structured error responses without rejecting', async () => {
    // Access the registered CallTool handler via the server object
    // or test request handling directly
    const handlers = (server as any)._requestHandlers;
    const callToolHandler = handlers.get(CallToolRequestSchema.shape.method.value);

    expect(callToolHandler).toBeDefined();

    const response = await callToolHandler({
      method: 'tools/call',
      params: {
        name: 'non_existent_tool',
        arguments: {},
      },
    });

    expect(response.isError).toBe(true);
    expect(response.content).toBeDefined();
    expect(response.content[0].text).toContain('Unknown tool: non_existent_tool');
  });

  it('formats invalid arguments to tools as structured error responses', async () => {
    const handlers = (server as any)._requestHandlers;
    const callToolHandler = handlers.get(CallToolRequestSchema.shape.method.value);

    // Call record_failure with invalid input (empty string command and invalid structure)
    const response = await callToolHandler({
      method: 'tools/call',
      params: {
        name: 'record_failure',
        arguments: {
          command: '',
          output: 'test',
        },
      },
    });

    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain('Error executing record_failure');
  });

  it('graceful shutdown flushes storage handles cleanly', async () => {
    // Calling shutdown should resolve without throwing
    await expect(shutdown('SIGTERM')).resolves.toBeUndefined();
  });
});
