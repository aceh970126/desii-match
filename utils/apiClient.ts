/**
 * API Client with retry logic and error handling
 */

import { logger } from "./logger";

export interface ApiRequestConfig {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry wrapper for async operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: ApiRequestConfig = {}
): Promise<T> {
  const { retries = 3, retryDelay = 1000 } = config;

  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors
      if (
        error instanceof ApiError &&
        error.statusCode &&
        error.statusCode >= 400 &&
        error.statusCode < 500
      ) {
        // Client errors (4xx) shouldn't be retried
        throw error;
      }

      if (attempt < retries) {
        logger.warn(
          `Attempt ${attempt + 1} failed, retrying in ${retryDelay}ms...`,
          error
        );
        await sleep(retryDelay * Math.pow(2, attempt)); // Exponential backoff
      }
    }
  }

  throw lastError;
}

/**
 * Timeout wrapper for promises
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new ApiError("Request timeout", 408)), timeoutMs)
    ),
  ]);
}

/**
 * Safe API call wrapper with error handling
 */
export async function safeApiCall<T>(
  operation: () => Promise<T>,
  config: ApiRequestConfig = {}
): Promise<{ data: T | null; error: ApiError | null }> {
  try {
    const data = await withRetry(
      () => withTimeout(operation(), config.timeout || 30000),
      config
    );
    return { data, error: null };
  } catch (error) {
    logger.error("API call failed:", error);

    if (error instanceof ApiError) {
      return { data: null, error };
    }

    return {
      data: null,
      error: new ApiError(
        error instanceof Error ? error.message : "Unknown error",
        undefined,
        error
      ),
    };
  }
}

/**
 * Batch multiple API calls with concurrency control
 */
export async function batchApiCalls<T>(
  operations: (() => Promise<T>)[],
  concurrency: number = 5
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const operation of operations) {
    const promise = operation().then((result) => {
      results.push(result);
      executing.splice(executing.indexOf(promise), 1);
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}
