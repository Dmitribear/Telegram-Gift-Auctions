import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 3000),
  mongoUrl:
    process.env.MONGO_URL ??
    "mongodb://localhost:27017/auction_db?replicaSet=rs0",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:4174",
  adminSecret: process.env.ADMIN_PASSWORD ?? process.env.ADMIN_TOKEN ?? "admin-secret",
  finalizePollMs: Number(process.env.FINALIZE_POLL_MS ?? 15000),
  notifyWebhookUrl: process.env.NOTIFY_WEBHOOK_URL,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
};
