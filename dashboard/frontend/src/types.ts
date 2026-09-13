export interface MemoryStats {
  totalRecords: number;
  exactFingerprints: number;
  quarantinedCount: number;
  verifiedCount: number;
  staleCount: number;
  successRate: number;
  ageDistribution: {
    under1h: number;
    under24h: number;
    under7d: number;
    over7d: number;
  };
}

export interface MemoryRecordSummary {
  id: string;
  fingerprint: string;
  command: string;
  commandFamily: string;
  exitCode: number;
  repositoryId: string;
  createdAt: string;
  normalizerVersion: number;
  isQuarantined: boolean;
  wilsonLowerBound: number | null;
  verificationStatus: string;
  fixExplanation: string;
  fixCommands: string[];
  poisoningFlag: {
    raisedAt: string;
    reason: string;
    status: string;
  } | null;
  provenance: {
    gitCommit?: string;
    gitBranch?: string;
    gitAuthor?: string;
    capturedAt?: string;
  };
}

export interface FullMemoryRecord extends MemoryRecordSummary {
  rawOutputRedacted: string;
  normalizedOutput: string;
  fix: {
    explanation: string;
    commands: string[];
    riskAssessment?: string;
  };
  environment: {
    lockfileHashes?: Record<string, string>;
    runtimeVersion?: string;
    normalizerVersion?: number;
  };
  verification: {
    status: string;
    verifiedAt?: string;
    method?: string;
    wilsonLowerBound?: number;
  };
  supersedes?: string | null;
}

export interface PendingApproval {
  approvalId: string;
  createdAt: string;
  requestedCommand: string;
  recordId: string | null;
  risk: {
    level: string;
    reasons: string[];
  };
  reason: string;
  status: string;
}

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

export interface ExplainabilityData {
  query: string;
  threshold: number;
  candidates: Array<{
    id: string;
    command: string;
    commandFamily: string;
    matchType: 'exact' | 'fuzzy';
    similarityScore: number;
    trustScore: number;
    passesThreshold: boolean;
    passedFilters: {
      repository: boolean;
      commandFamily: boolean;
      exitCode: boolean;
    };
    staleReasons: string[];
    isStale: boolean;
    isQuarantined: boolean;
  }>;
}

export interface BenchmarkData {
  status: string;
  description: string;
  baselines: Array<{
    name: string;
    timeToRepairSec: number;
    toolCalls: number;
    successRate: number;
    falseReuseRate: number;
  }>;
  retrievalLatencyMs: {
    records100: { p50: number; p95: number };
    records1000: { p50: number; p95: number };
    records10000: { p50: number; p95: number };
  };
  ablations: Array<{
    name: string;
    riskScore?: string;
    staleReusePercent?: number;
    poisonedRetrievalPercent?: number;
    latencyDeltaMs: number;
  }>;
}
