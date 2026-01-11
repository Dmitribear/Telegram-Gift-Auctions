import express from "express";
import cors from "cors";
import connectDB from "./config/db";
import "./config/env";
import auctionRoutes from "./api/routes/auction.routes";
import adminRoutes from "./api/routes/admin.routes";
import userRoutes from "./api/routes/user.routes";
import authRoutes from "./api/routes/auth.routes";
import botApiRoutes from "./api/routes/botapi.routes";
import transactionRoutes from "./api/routes/transaction.routes";
import promClient from "prom-client";

const app = express();

const allowedOrigin = "http://localhost:4174";
app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Admin-Token"],
    credentials: false,
    optionsSuccessStatus: 204,
  })
);

// simple JSON logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        durationMs: duration,
      })
    );
  });
  next();
});

app.use(express.json());

app.use("/auctions", auctionRoutes);
app.use("/admin", adminRoutes);
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/bot-api", botApiRoutes);
app.use("/transactions", transactionRoutes);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Prometheus metrics
promClient.collectDefaultMetrics();
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

const port = Number(process.env.PORT ?? 3000);

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Startup error", error);
    process.exit(1);
  });
