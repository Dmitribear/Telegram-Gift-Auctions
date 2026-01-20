import http from "http";
import "./config/env";
import connectDB from "./config/db";
import { env } from "./config/env";
import { app } from "./app";
import { notificationService } from "./services/NotificationService";
import { startAuctionFinalizer } from "./scheduler/finalizer";
import { logger } from "./utils/logger";

const port = env.port ?? 3000;

connectDB()
  .then(() => {
    const server = http.createServer(app);
    notificationService.attachWebSocket(server);
    server.listen(port, () => {
      logger.info(`Server listening on http://localhost:${port}`);
    });
    startAuctionFinalizer();
  })
  .catch((error) => {
    logger.error("Startup error", { error: (error as Error).message });
    process.exit(1);
  });
