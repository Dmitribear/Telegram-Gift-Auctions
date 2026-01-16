import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 3000),
  mongoUrl:
    process.env.MONGO_URL ??
    "mongodb://localhost:27017/auction_db?replicaSet=rs0",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
};
