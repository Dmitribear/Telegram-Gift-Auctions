import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const disabled = process.env.DISABLE_LOCKS === "true" || process.env.NODE_ENV === "test";

export const redis = disabled
  ? null
  : new Redis(redisUrl, {
      enableOfflineQueue: false,
    });

if (redis) {
  redis.on("error", (err) => {
    console.error("Redis error", err);
  });
}
