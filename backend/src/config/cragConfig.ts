import type { AppEnv } from "./env";

export interface CragConfig {
  notFoundThreshold: number;
  topK: number;
  rerankTopN: number;
  geminiModel: string;
}

export function buildCragConfig(env: AppEnv): CragConfig {
  return {
    notFoundThreshold: env.notFoundThreshold,
    topK: env.topK,
    rerankTopN: env.rerankTopN,
    geminiModel: env.geminiModel
  };
}
