/**
 * MCP Server entry point — agent-memory-mcp.
 * Targets MCP specification 2026-07-28.
 *
 * CRITICAL INVARIANT: stdout carries JSON-RPC framing only.
 * All application logs go to stderr and .agent-memory/logs.jsonl.
 */

import path from 'node:path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { MemoryService } from './core/memoryService.js';
import { createMemoryLogger } from './core/logger.js';
import {
  RECORD_FAILURE_SCHEMA,
  FIND_FIX_SCHEMA,
  VERIFY_FIX_SCHEMA,
  LIST_MEMORY_STATS_SCHEMA,
} from './schemas/toolSchemas.js';
import type { RecordFailureInput, FindFixInput, MemoryStatsInput, VerifyFixInput } from './types.js';

const workspaceDir = process.env.AGENT_MEMORY_DIR ?? path.join(process.cwd(), '.agent-memory');
const repositoryId = process.env.AGENT_MEMORY_REPO ?? path.basename(process.cwd());

const logger = createMemoryLogger({
  logFilePath: path.join(workspaceDir, 'logs.jsonl'),
});

const service = new MemoryService({
  memoryDir: workspaceDir,
  repositoryId,
  logger,
});

export const server = new Server(
  {
    name: 'agent-memory-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Define tool listings
const TOOLS: Tool[] = [
  {
    name: 'record_failure',
    description:
      'Records a failed command output along with the verified or proposed fix into repository memory.',
    inputSchema: RECORD_FAILURE_SCHEMA,
  },
  {
    name: 'find_fix',
    description:
      'Retrieves past recorded fixes matching a command failure by exact or fuzzy error trace.',
    inputSchema: FIND_FIX_SCHEMA,
  },
  {
    name: 'verify_fix',
    description:
      'Validates a fix command under policy (dry-run by default). Live execution requires an operator-resolved approval entry in .agent-memory/approvals-resolved.jsonl.',
    inputSchema: VERIFY_FIX_SCHEMA,
  },
  {
    name: 'list_memory_stats',
    description: 'Returns aggregate statistics about the repository memory store.',
    inputSchema: LIST_MEMORY_STATS_SCHEMA,
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  await Promise.resolve();
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case 'record_failure': {
        const result = await service.recordFailure(args as unknown as RecordFailureInput);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'find_fix': {
        const result = await service.findFix(args as unknown as FindFixInput);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'verify_fix': {
        const result = await service.verifyFix(args as unknown as VerifyFixInput);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'list_memory_stats': {
        const result = service.getStats(args as unknown as MemoryStatsInput);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ event: 'tool_call_error', tool: name, error: message }, 'Tool call failed');
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${message}`,
        },
      ],
    };
  }
});

export async function startServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info(
    { event: 'server_started', transport: 'stdio', version: '0.1.0' },
    'agent-memory-mcp server started',
  );
}

// Auto-run if executed as main module
if (process.argv[1]?.endsWith('server.js')) {
  startServer().catch((err: unknown) => {
    logger.fatal({ event: 'server_crash', error: String(err) }, 'Fatal server error');
    process.exit(1);
  });
}
