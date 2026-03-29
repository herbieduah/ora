/**
 * Hook stub for photo analysis.
 * Returns no-op state until AI is wired up.
 */

import { useCallback, useState } from "react";
import type { PhotoAnalysis, AnalysisStatus } from "./types";
import { analyzePhoto } from "./photo-tagger";

interface UsePhotoAnalysisResult {
  analysis: PhotoAnalysis | null;
  status: AnalysisStatus;
  analyze: (photoUri: string) => Promise<void>;
}

export function usePhotoAnalysis(): UsePhotoAnalysisResult {
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>("idle");

  const analyze = useCallback(async (photoUri: string) => {
    setStatus("pending");
    try {
      const result = await analyzePhoto(photoUri);
      setAnalysis(result);
      setStatus("complete");
    } catch {
      setStatus("failed");
    }
  }, []);

  return { analysis, status, analyze };
}
