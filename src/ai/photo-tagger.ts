/**
 * Photo tagging service stub.
 * Replace with real on-device AI implementation later.
 */

import type { PhotoAnalysis, PhotoTag } from "./types";

/**
 * Analyze a photo and generate tags.
 * Currently a no-op stub — returns empty analysis.
 */
export async function analyzePhoto(
  _photoUri: string,
): Promise<PhotoAnalysis> {
  // TODO: Wire up on-device AI model (Apple Vision, TFLite, etc.)
  return {
    tags: [],
    description: "",
    status: "idle",
    analyzedAt: null,
  };
}

/**
 * Generate tags from a photo URI.
 * Currently a no-op stub — returns empty array.
 */
export async function generateTags(
  _photoUri: string,
): Promise<PhotoTag[]> {
  // TODO: Wire up on-device AI model
  return [];
}
