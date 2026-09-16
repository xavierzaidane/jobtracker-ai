import {
  detectATSSource,
  parseGreenhouseEmail,
  parseLeverEmail,
  parseATSEmail,
  getATSSourceBadge as _getATSSourceBadge,
} from './ats_engine.mjs';
import type { ATSSource, ApplicationStatus, ATSMetadata } from '@/types/application';

export interface EmailInput {
  sender?: string | null;
  subject?: string | null;
  snippet?: string | null;
  body_cleaned?: string | null;
  raw_body?: string | null;
  headers?: Record<string, string> | null;
}

export interface ATSParsedResult {
  company: string;
  role: string;
  status: ApplicationStatus;
  confidence_score: number;
  ai_rationale: string;
  summary: string;
  ats_source: 'greenhouse' | 'lever';
  ats_metadata: ATSMetadata;
}

export interface ATSBadgeConfig {
  label: string;
  name: string;
  color: string;
  textClass: string;
  bg: string;
  bgClass: string;
  borderClass: string;
}

export function getATSSourceBadge(source?: string | null): ATSBadgeConfig | null {
  return _getATSSourceBadge(source);
}

export {
  detectATSSource,
  parseGreenhouseEmail,
  parseLeverEmail,
  parseATSEmail,
};

