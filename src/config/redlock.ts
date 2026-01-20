import Redlock from "redlock";
import { redis } from "./redis";

const disabled = process.env.DISABLE_LOCKS === "true" || process.env.NODE_ENV === "test";

type Lock = { release: () => Promise<void> };

export const redlock: { acquire: (keys: string[], ttl: number) => Promise<Lock> } = disabled
  ? {
      acquire: async () => ({
        release: async () => undefined,
      }),
    }
  : new Redlock([redis!], {
      driftFactor: 0.01,
      retryCount: 10,
      retryDelay: 200,
      retryJitter: 200,
    });

if (!disabled && (redlock as any).on) {
  (redlock as any).on("error", (err: Error) => {
    console.error("Redlock error", err);
  });
}
