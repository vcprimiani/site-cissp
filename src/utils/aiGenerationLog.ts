// AI GENERATION LOGGING UTILITY
// --------------------------------------------------
// This file is used to log failed or malformed AI question generations.
// If you are tuning prompts or debugging AI output, check here for recent failures.
// You can extend this to persist logs to a backend or file if needed.
// --------------------------------------------------

interface FailedAIGeneration {
  question: string;
  options: string[];
  explanation: string;
  reason: string;
  timestamp: string;
}

const failedGenerations: FailedAIGeneration[] = [];

export function logFailedAIGeneration(
  question: string,
  options: string[],
  explanation: string,
  reason: string
) {
  const entry: FailedAIGeneration = {
    question,
    options,
    explanation,
    reason,
    timestamp: new Date().toISOString()
  };
  failedGenerations.push(entry);
  // Print to console for devs
  console.warn('[AI Generation Failure]', entry);
}

export function getFailedAIGenerations() {
  return failedGenerations;
} 