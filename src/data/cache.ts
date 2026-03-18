/**
 * Benchmark data loader
 *
 * Loads benchmark data exclusively from the pre-validated snapshot.json.
 * All models in the snapshot have been verified against the OpenRouter catalog
 * during `npm run pull:snapshot`.
 */

import type { BenchmarkData, ModelBenchmark } from "./types.js";
import snapshotData from "./snapshot.json";

const SNAPSHOT_STALE_MS = 6 * 60 * 60 * 1000; // 6 hours

export class BenchmarkCache {
  private data: BenchmarkData | null = null;

  /**
   * Load benchmark data from snapshot.json.
   */
  async load(): Promise<BenchmarkData> {
    if (this.data) {
      return this.data;
    }

    this.data = this.getFallbackData();

    // Warn if snapshot is stale
    const fetchedAt = (snapshotData as { fetchedAt?: string }).fetchedAt;
    if (fetchedAt) {
      const ageMs = Date.now() - new Date(fetchedAt).getTime();
      if (ageMs > SNAPSHOT_STALE_MS) {
        const hours = Math.floor(ageMs / (60 * 60 * 1000));
        console.warn(
          `[EcoClaw] Benchmark snapshot is ${hours}h old. Run "npm run pull:snapshot" to update.`
        );
      }
    }

    return this.data;
  }

  /**
   * Load data from snapshot.json.
   * All models in the snapshot have been validated against OpenRouter during pull:snapshot.
   */
  getFallbackData(): BenchmarkData {
    const data: BenchmarkData = new Map();

    for (const entry of (snapshotData as { models: Array<Record<string, unknown>> }).models) {
      const cost = entry.cost as number | null;
      if (cost === null || cost === undefined || cost <= 0) continue;

      const benchmark: ModelBenchmark = {
        model: entry.model as string,
        provider: entry.provider as string,
        overallScore: entry.overallScore as number,
        speed: (entry.speed as number | null) ?? null,
        cost,
        taskScores: (entry.taskScores as Array<{ taskId: string; score: number; maxScore: number }>),
        submissionId: entry.submissionId as string,
      };

      data.set(benchmark.model, benchmark);
    }

    return data;
  }
}
