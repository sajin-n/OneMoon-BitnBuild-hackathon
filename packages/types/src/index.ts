/**
 * @onemoon/types
 * Foundational TypeScript interfaces and types for the OneMoon ecosystem.
 */

export type ServiceStatus = 'ok' | 'degraded' | 'down';

export interface HealthResponse {
  status: ServiceStatus;
  service: string;
  version?: string;
  timestamp?: string;
}

export type ThreatLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical' | 'unknown';

export interface ThreatIndicator {
  type: 'suspicious_domain' | 'dmarc_fail' | 'spf_fail' | 'malicious_link' | 'ai_phishing_heuristic' | 'known_ioc';
  severity: ThreatLevel;
  description: string;
  evidence?: Record<string, unknown>;
}

export interface EmailMetadata {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  timestamp: string;
  headers?: Record<string, string>;
  hasAttachments?: boolean;
}

export interface AnalysisVerdict {
  id: string;
  targetType: 'email' | 'url' | 'domain';
  threatLevel: ThreatLevel;
  confidenceScore: number;
  indicators: ThreatIndicator[];
  analyzedAt: string;
}

export interface UrlScanRequest {
  url: string;
  sourceContext?: 'email' | 'browser_navigation';
}

export interface UrlScanVerdict {
  url: string;
  threatLevel: ThreatLevel;
  riskScore: number;
  categories: string[];
  scanTimestamp: string;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  payloadHash?: string;
  blockchainTxHash?: string;
}
