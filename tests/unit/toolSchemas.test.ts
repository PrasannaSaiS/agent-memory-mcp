import { describe, it, expect } from 'vitest';
import {
  RECORD_FAILURE_SCHEMA,
  FIND_FIX_SCHEMA,
  VERIFY_FIX_SCHEMA,
  LIST_MEMORY_STATS_SCHEMA,
} from '../../src/schemas/toolSchemas.js';

describe('Tool Schemas Definition', () => {
  it('defines valid RECORD_FAILURE_SCHEMA', () => {
    expect(RECORD_FAILURE_SCHEMA.type).toBe('object');
    expect(RECORD_FAILURE_SCHEMA.required).toContain('command');
    expect(RECORD_FAILURE_SCHEMA.required).toContain('output');
    expect(RECORD_FAILURE_SCHEMA.required).toContain('fixCommands');
    expect(RECORD_FAILURE_SCHEMA.required).toContain('explanation');
    expect(RECORD_FAILURE_SCHEMA.properties?.command).toBeDefined();
  });

  it('defines valid FIND_FIX_SCHEMA', () => {
    expect(FIND_FIX_SCHEMA.type).toBe('object');
    expect(FIND_FIX_SCHEMA.required).toContain('command');
    expect(FIND_FIX_SCHEMA.required).toContain('output');
    expect(FIND_FIX_SCHEMA.properties?.command).toBeDefined();
  });

  it('defines valid VERIFY_FIX_SCHEMA', () => {
    expect(VERIFY_FIX_SCHEMA.type).toBe('object');
    expect(VERIFY_FIX_SCHEMA.required).toContain('command');
    expect(VERIFY_FIX_SCHEMA.properties?.dryRun).toBeDefined();
  });

  it('defines valid LIST_MEMORY_STATS_SCHEMA', () => {
    expect(LIST_MEMORY_STATS_SCHEMA.type).toBe('object');
    expect(LIST_MEMORY_STATS_SCHEMA.properties).toBeDefined();
  });
});
