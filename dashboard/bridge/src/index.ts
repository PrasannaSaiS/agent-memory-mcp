/**
 * Dashboard bridge entry point — stub.
 *
 * ARCHITECTURE (AGENTS.md / dashboard-spec.md):
 * - This is a SEPARATE process from the MCP stdio server.
 * - It MUST NOT share stdin, stdout, or in-memory state with the MCP server.
 * - It is read-only against .agent-memory/*, with one exception:
 *   writing operator decisions to approvals-resolved.jsonl when a human
 *   clicks Approve/Deny. It MUST NOT execute commands.
 * - Binds to 127.0.0.1 only (local trust boundary).
 *
 * Implementation in Phase 6 (dashboard build phase).
 */

export {};
