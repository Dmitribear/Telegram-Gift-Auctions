import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import auctionRoutes from "./api/routes/auction.routes";
import adminRoutes from "./api/routes/admin.routes";
import userRoutes from "./api/routes/user.routes";
import authRoutes from "./api/routes/auth.routes";
import botApiRoutes from "./api/routes/botapi.routes";
import transactionRoutes from "./api/routes/transaction.routes";
import walletRoutes from "./api/routes/wallet.routes";
import { errorHandler } from "./api/middleware/errorHandler";
import { httpRequestDuration, metricsRegistry } from "./config/metrics";
import { openApiSpec } from "./config/swagger";
import { logger } from "./utils/logger";
import { env } from "./config/env";

const allowedOrigin = env.corsOrigin;

export const app = express();

app.use(
  cors({
    origin: allowedOrigin === "*" ? "*" : [allowedOrigin],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Admin-Token", "X-API-Key"],
    credentials: false,
    optionsSuccessStatus: 204,
  })
);

app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const route = (req as any).route?.path || req.path;
    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status: res.statusCode.toString(),
      },
      duration
    );
    logger.info("http_request", {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
    });
  });
  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", metricsRegistry.contentType);
  res.end(await metricsRegistry.metrics());
});

app.use("/auctions", auctionRoutes);
app.use("/admin", adminRoutes);
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/bot-api", botApiRoutes);
app.use("/transactions", transactionRoutes);
app.use("/wallet", walletRoutes);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use(errorHandler);
