import { redlock } from "../config/redlock";
import { logger } from "./logger";

const localLocks = new Set<string>();

async function withLocalLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  while (localLocks.has(key)) {
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  localLocks.add(key);
  try {
    return await fn();
  } finally {
    localLocks.delete(key);
  }
}

export async function withLock<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  if (process.env.DISABLE_LOCKS === "true") {
    return fn();
  }
  const resource = `locks:${key}`;
  try {
    const lock = await redlock.acquire([resource], ttlMs);
    try {
      return await fn();
    } finally {
      await lock.release().catch(() => undefined);
    }
  } catch (err) {
    logger.warn("Falling back to in-memory lock", { key, error: (err as Error).message });
    return withLocalLock(resource, fn);
  }
}
