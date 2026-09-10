# ADR-007: MCP Specification Version Target

**Status:** Accepted  
**Date:** 2026-09-10  
**Deciders:** Project team

## Context

The original project plan and implementation kit were authored against an MCP baseline that predates the current specification. The audit addendum (§2, issue #7) identifies this as a High-severity risk because the 2026-07-28 specification introduced materially different protocol surfaces (stateless protocol core, multi round-trip requests, header-based routing, cacheable list results, and authorization hardening).

## Decision

**Target: MCP specification version 2026-07-28.**

- Source: https://modelcontextprotocol.io/specification/2026-07-28
- SDK: `@modelcontextprotocol/sdk` pinned to `1.17.0` (verify this release targets spec 2026-07-28 before Phase 1 implementation begins).

Before beginning Phase 1 implementation, re-verify SDK release notes confirm compatibility with spec 2026-07-28. Update this ADR with the verification result.

## Consequences

- All transport, authorization, and tool-schema assumptions derive from spec 2026-07-28, not the November-2025 baseline.
- Any assumption inherited from the original planning documents that conflicts with spec 2026-07-28 must be flagged and resolved via a new ADR before implementation proceeds.
- MCP Inspector used during development must be a version released after CVE-2025-49596 fix. Pin the exact version in the dev-dependency policy.
