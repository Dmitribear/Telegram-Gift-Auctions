import { redlock } from "../config/redlock";

export async function withLock<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const resource = `locks:${key}`;
  const lock = await redlock.acquire([resource], ttlMs);

  try {
    return await fn();
  } finally {
    await lock.release().catch(() => undefined);
  }
}
