/**
 * On-device AI types for photo analysis and tagging.
 * These are stubs — no AI SDK dependency yet.
 */

export type AnalysisStatus = "idle" | "pending" | "complete" | "failed";

export interface PhotoTag {
  label: string;
  confidence: number; // 0-1
}

export interface PhotoAnalysis {
  tags: PhotoTag[];
  description: string;
  status: AnalysisStatus;
  analyzedAt: number | null; // Unix ms
}

export interface AIConfig {
  enabled: boolean;
  maxTags: number;
  minConfidence: number;
  analyzeInBackground: boolean;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  enabled: false,
  maxTags: 5,
  minConfidence: 0.7,
  analyzeInBackground: true,
};
